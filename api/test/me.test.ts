import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { nowSec } from "../src/lib/time";
import { ulid } from "../src/lib/ulid";
import { BASE, seedParent, seedSession } from "./helpers";

function getMe(cookie?: string) {
  return SELF.fetch(`${BASE}/me`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /me", () => {
  it("returns unauthenticated without a cookie", async () => {
    const res = await getMe();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ authenticated: false });
  });

  it("returns parent mode after sign-in", async () => {
    const { parentId, familyId } = await seedParent("me-parent@example.com");
    const { cookie } = await seedSession(parentId);

    const res = await getMe(cookie);
    const body = (await res.json()) as any;
    expect(body.authenticated).toBe(true);
    expect(body.mode).toBe("parent");
    expect(body.elevated).toBe(false);
    expect(body.parent.email).toBe("me-parent@example.com");
    expect(body.family.id).toBe(familyId);
    expect(body.subscription.status).toBe("none");
    expect(body.entitlements.apps_unlocked).toEqual([]);
  });

  it("reports elevated when the session is elevated", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId, { elevatedUntil: nowSec() + 600 });
    const body = (await (await getMe(cookie)).json()) as any;
    expect(body.elevated).toBe(true);
  });

  it("unlocks all apps when subscription is active", async () => {
    const { parentId, familyId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const now = nowSec();
    await env.DB.prepare(
      "INSERT INTO subscriptions (id, family_id, stripe_customer_id, status, plan, current_period_end, created_at, updated_at) VALUES (?, ?, ?, 'active', 'monthly', ?, ?, ?)",
    )
      .bind(ulid(), familyId, `cus_${ulid()}`, now + 86400, now, now)
      .run();

    const body = (await (await getMe(cookie)).json()) as any;
    expect(body.subscription.status).toBe("active");
    expect(body.entitlements.apps_unlocked).toContain("mr-know-it-all");
    expect(body.entitlements.apps_unlocked.length).toBe(6);
  });

  it("applies family_app_overrides (disabled removes, comped adds)", async () => {
    const { parentId, familyId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const now = nowSec();
    // No subscription => base empty, but a comped override adds one app.
    await env.DB.prepare(
      "INSERT INTO family_app_overrides (family_id, app_slug, state, created_at) VALUES (?, 'kaleidoscope-camera', 'comped', ?)",
    )
      .bind(familyId, now)
      .run();

    const body = (await (await getMe(cookie)).json()) as any;
    expect(body.entitlements.apps_unlocked).toEqual(["kaleidoscope-camera"]);
  });
});
