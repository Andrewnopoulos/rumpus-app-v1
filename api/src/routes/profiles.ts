import type { Ctx } from "../index";
import { errorResponse, json, readJsonBody } from "../lib/responses";
import { nowSec } from "../lib/time";
import { ulid } from "../lib/ulid";
import { requireKidMode, requireParentMode } from "../middleware/elevation";
import { writeKvSession } from "../middleware/session";

const AVATAR_MIN = 0;
const AVATAR_MAX = 19;
const NAME_MIN = 1;
const NAME_MAX = 30;
const AGE_BANDS = new Set(["under_5", "5_7", "8_10"]);

interface ProfileRow {
  id: string;
  display_name: string;
  avatar_id: number;
  age_band: string | null;
  created_at: number;
}

/** Resolve the family_id for the current parent-mode session. */
async function familyIdForSession(c: Ctx, parentId: string): Promise<string | null> {
  const row = await c.env.DB.prepare("SELECT family_id FROM parents WHERE id = ?")
    .bind(parentId)
    .first<{ family_id: string }>();
  return row?.family_id ?? null;
}

/** Smallest avatar_id in [0,19] not used by a non-deleted profile in family. */
function nextFreeAvatar(used: Set<number>): number | null {
  for (let i = AVATAR_MIN; i <= AVATAR_MAX; i++) {
    if (!used.has(i)) return i;
  }
  return null;
}

/**
 * POST /profiles  { display_name, avatar_id, age_band? }
 * Creates a kid profile. Parent mode required (device-trusted is fine).
 */
export async function createProfile(c: Ctx): Promise<Response> {
  const guard = requireParentMode(c.session);
  if (guard) return guard;
  const familyId = await familyIdForSession(c, c.session!.parent_id);
  if (!familyId) return errorResponse(401, "unauthenticated", "Sign in required.");

  const body = await readJsonBody<{
    display_name?: unknown;
    avatar_id?: unknown;
    age_band?: unknown;
  }>(c.req);

  const displayName =
    typeof body?.display_name === "string" ? body.display_name.trim() : "";
  if (displayName.length < NAME_MIN || displayName.length > NAME_MAX) {
    return errorResponse(
      400,
      "invalid_display_name",
      `display_name must be ${NAME_MIN}-${NAME_MAX} characters.`,
    );
  }

  const avatarId = body?.avatar_id;
  if (
    typeof avatarId !== "number" ||
    !Number.isInteger(avatarId) ||
    avatarId < AVATAR_MIN ||
    avatarId > AVATAR_MAX
  ) {
    return errorResponse(
      400,
      "invalid_avatar_id",
      `avatar_id must be an integer ${AVATAR_MIN}-${AVATAR_MAX}.`,
    );
  }

  let ageBand: string | null = null;
  if (body?.age_band !== undefined && body?.age_band !== null) {
    if (typeof body.age_band !== "string" || !AGE_BANDS.has(body.age_band)) {
      return errorResponse(
        400,
        "invalid_age_band",
        "age_band must be one of: under_5, 5_7, 8_10.",
      );
    }
    ageBand = body.age_band;
  }

  // Avatar uniqueness within the family (non-deleted profiles).
  const existing = await c.env.DB.prepare(
    "SELECT avatar_id FROM kid_profiles WHERE family_id = ? AND deleted_at IS NULL",
  )
    .bind(familyId)
    .all<{ avatar_id: number }>();
  const used = new Set((existing.results ?? []).map((r) => r.avatar_id));
  if (used.has(avatarId)) {
    const suggestion = nextFreeAvatar(used);
    return json(
      {
        error: {
          code: "avatar_taken",
          message: "That avatar is already used by another profile.",
        },
        suggested_avatar_id: suggestion,
      },
      { status: 409 },
    );
  }

  const now = nowSec();
  const id = ulid();
  await c.env.DB.prepare(
    "INSERT INTO kid_profiles (id, family_id, display_name, avatar_id, age_band, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(id, familyId, displayName, avatarId, ageBand, now)
    .run();

  return json(
    {
      id,
      display_name: displayName,
      avatar_id: avatarId,
      age_band: ageBand,
      created_at: now,
    },
    { status: 201 },
  );
}

/**
 * GET /profiles
 * Returns all non-deleted profiles for the family, oldest first.
 */
export async function listProfiles(c: Ctx): Promise<Response> {
  const guard = requireParentMode(c.session);
  if (guard) return guard;
  const familyId = await familyIdForSession(c, c.session!.parent_id);
  if (!familyId) return errorResponse(401, "unauthenticated", "Sign in required.");

  const res = await c.env.DB.prepare(
    "SELECT id, display_name, avatar_id, age_band, created_at FROM kid_profiles WHERE family_id = ? AND deleted_at IS NULL ORDER BY created_at ASC, id ASC",
  )
    .bind(familyId)
    .all<ProfileRow>();

  return json({ profiles: res.results ?? [] });
}

/**
 * POST /profiles/:id/select
 * Switches the current session into kid mode for the given profile and drops
 * any elevation. Parent mode required.
 */
export async function selectProfile(c: Ctx, profileId: string): Promise<Response> {
  const guard = requireParentMode(c.session);
  if (guard) return guard;
  const session = c.session!;
  const familyId = await familyIdForSession(c, session.parent_id);
  if (!familyId) return errorResponse(401, "unauthenticated", "Sign in required.");

  const profile = await c.env.DB.prepare(
    "SELECT id FROM kid_profiles WHERE id = ? AND family_id = ? AND deleted_at IS NULL",
  )
    .bind(profileId, familyId)
    .first<{ id: string }>();
  if (!profile) {
    return errorResponse(404, "profile_not_found", "No such profile in this family.");
  }

  const now = nowSec();
  await c.env.DB.prepare(
    "UPDATE sessions SET active_profile = ?, elevated_until = NULL, last_seen_at = ? WHERE id = ?",
  )
    .bind(profileId, now, session.id)
    .run();
  await writeKvSession(c.env, {
    ...session,
    active_profile: profileId,
    elevated_until: null,
    last_seen_at: now,
  });

  return json({ ok: true, mode: "kid", active_profile: profileId });
}

/**
 * POST /profiles/deselect
 * Drops the active kid profile, returning the session to parent mode. Kid mode
 * required. No elevation needed — exiting kid mode is not a sensitive action.
 */
export async function deselectProfile(c: Ctx): Promise<Response> {
  const guard = requireKidMode(c.session);
  if (guard) return guard;
  const session = c.session!;

  const now = nowSec();
  await c.env.DB.prepare(
    "UPDATE sessions SET active_profile = NULL, elevated_until = NULL, last_seen_at = ? WHERE id = ?",
  )
    .bind(now, session.id)
    .run();
  await writeKvSession(c.env, {
    ...session,
    active_profile: null,
    elevated_until: null,
    last_seen_at: now,
  });

  return json({ ok: true, mode: "parent" });
}
