import type { Ctx } from "../index";
import { json } from "../lib/responses";
import { nowSec } from "../lib/time";

// Known app slugs for v1. Entitlements grant all of these when the family's
// subscription is trialing/active, then family_app_overrides are applied.
export const APP_SLUGS = [
  "mr-know-it-all",
  "kaleidoscope-camera",
  "flipa-clone",
  "talking-tom-clone",
  "filter-app",
  "dinner-planner",
] as const;

interface ParentRow {
  id: string;
  email: string;
  display_name: string | null;
}
interface ParentWithFamilyRow extends ParentRow {
  family_id: string;
}
interface FamilyRow {
  id: string;
  display_name: string | null;
}
interface ProfileRow {
  id: string;
  display_name: string;
  avatar_id: number;
}
interface SubscriptionRow {
  status: string;
  plan: string | null;
  current_period_end: number | null;
}
interface OverrideRow {
  app_slug: string;
  state: string; // 'comped' | 'disabled'
  expires_at: number | null;
}

/**
 * Compute unlocked app slugs: base set when subscription is trialing/active,
 * then apply family overrides (disabled removes, comped adds). Expired
 * overrides (expires_at <= now) are ignored.
 */
function computeEntitlements(
  subStatus: string | null,
  overrides: OverrideRow[],
  now: number,
): string[] {
  const unlocked = new Set<string>(
    subStatus === "trialing" || subStatus === "active" ? APP_SLUGS : [],
  );
  for (const o of overrides) {
    if (o.expires_at !== null && o.expires_at <= now) continue;
    if (o.state === "disabled") unlocked.delete(o.app_slug);
    else if (o.state === "comped") unlocked.add(o.app_slug);
  }
  // Stable order following the canonical slug list, then any extra comped slugs.
  const ordered = (APP_SLUGS as readonly string[]).filter((s) => unlocked.has(s));
  const orderedSet = new Set(ordered);
  const extras = [...unlocked].filter((s) => !orderedSet.has(s));
  return [...ordered, ...extras];
}

async function familyOverrides(c: Ctx, familyId: string): Promise<OverrideRow[]> {
  const res = await c.env.DB.prepare(
    "SELECT app_slug, state, expires_at FROM family_app_overrides WHERE family_id = ?",
  )
    .bind(familyId)
    .all<OverrideRow>();
  return res.results ?? [];
}

async function subscriptionFor(
  c: Ctx,
  familyId: string,
): Promise<SubscriptionRow | null> {
  return c.env.DB.prepare(
    "SELECT status, plan, current_period_end FROM subscriptions WHERE family_id = ?",
  )
    .bind(familyId)
    .first<SubscriptionRow>();
}

/** GET /me — returns session state in one of three shapes. */
export async function me(c: Ctx): Promise<Response> {
  const session = c.session;
  if (!session) {
    return json({ authenticated: false });
  }

  const now = nowSec();

  const parent = await c.env.DB.prepare(
    "SELECT id, email, display_name, family_id FROM parents WHERE id = ?",
  )
    .bind(session.parent_id)
    .first<ParentWithFamilyRow>();
  if (!parent) {
    // Session points at a missing parent — treat as unauthenticated.
    return json({ authenticated: false });
  }

  const family = await c.env.DB.prepare(
    "SELECT id, display_name FROM families WHERE id = ?",
  )
    .bind(parent.family_id)
    .first<FamilyRow>();
  if (!family) {
    return json({ authenticated: false });
  }

  const sub = await subscriptionFor(c, family.id);
  const overrides = await familyOverrides(c, family.id);
  const appsUnlocked = computeEntitlements(sub?.status ?? null, overrides, now);

  // Kid mode
  if (session.active_profile) {
    const profile = await c.env.DB.prepare(
      "SELECT id, display_name, avatar_id FROM kid_profiles WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(session.active_profile)
      .first<ProfileRow>();
    if (!profile) {
      // Active profile was deleted out from under the session.
      return json({ authenticated: false });
    }
    return json({
      authenticated: true,
      mode: "kid",
      profile: {
        id: profile.id,
        display_name: profile.display_name,
        avatar_id: profile.avatar_id,
      },
      family_id: family.id,
      entitlements: { apps_unlocked: appsUnlocked },
    });
  }

  // Parent mode (device-trusted or elevated)
  const elevated = (session.elevated_until ?? 0) > now;

  const coParentsRes = await c.env.DB.prepare(
    "SELECT id, email, display_name FROM parents WHERE family_id = ? AND id != ? AND deleted_at IS NULL ORDER BY created_at ASC, id ASC",
  )
    .bind(family.id, parent.id)
    .all<ParentRow>();

  const profilesRes = await c.env.DB.prepare(
    "SELECT id, display_name, avatar_id FROM kid_profiles WHERE family_id = ? AND deleted_at IS NULL ORDER BY created_at ASC, id ASC",
  )
    .bind(family.id)
    .all<ProfileRow>();

  return json({
    authenticated: true,
    mode: "parent",
    elevated,
    parent: { id: parent.id, email: parent.email, display_name: parent.display_name },
    family: { id: family.id, display_name: family.display_name },
    co_parents: (coParentsRes.results ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
    })),
    profiles: (profilesRes.results ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_id: p.avatar_id,
    })),
    subscription: {
      status: sub?.status ?? "none",
      plan: sub?.plan ?? null,
      current_period_end: sub?.current_period_end ?? null,
    },
    entitlements: { apps_unlocked: appsUnlocked },
  });
}
