import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { BASE, seedParent, seedSession } from "./helpers";

function post(path: string, body: unknown, cookie?: string) {
  return SELF.fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function createProfile(cookie: string, body: unknown) {
  return post("/profiles", body, cookie);
}

describe("POST /profiles", () => {
  it("creates a profile in parent mode", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);

    const res = await createProfile(cookie, {
      display_name: "Alex",
      avatar_id: 3,
      age_band: "5_7",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.display_name).toBe("Alex");
    expect(body.avatar_id).toBe(3);
    expect(body.id).toHaveLength(26);
  });

  it("trims and rejects empty display_name", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const res = await createProfile(cookie, { display_name: "   ", avatar_id: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects out-of-range avatar_id", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const res = await createProfile(cookie, { display_name: "Sam", avatar_id: 20 });
    expect(res.status).toBe(400);
  });

  it("returns 409 with a suggestion for a duplicate avatar", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    await createProfile(cookie, { display_name: "Alex", avatar_id: 3 });

    const dup = await createProfile(cookie, { display_name: "Bo", avatar_id: 3 });
    expect(dup.status).toBe(409);
    const body = (await dup.json()) as any;
    expect(body.error.code).toBe("avatar_taken");
    expect(body.suggested_avatar_id).toBe(0); // 0 is the lowest unused
  });

  it("requires a session (401 when unauthenticated)", async () => {
    const res = await post("/profiles", { display_name: "X", avatar_id: 1 });
    expect(res.status).toBe(401);
  });
});

describe("GET /profiles", () => {
  it("returns profiles oldest-first", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    await createProfile(cookie, { display_name: "First", avatar_id: 1 });
    await createProfile(cookie, { display_name: "Second", avatar_id: 2 });

    const res = await SELF.fetch(`${BASE}/profiles`, { headers: { cookie } });
    const body = (await res.json()) as any;
    expect(body.profiles).toHaveLength(2);
    expect(body.profiles[0].display_name).toBe("First");
    expect(body.profiles[1].display_name).toBe("Second");
  });
});

describe("POST /profiles/:id/select", () => {
  it("puts the session into kid mode and blocks profile creation", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const created = (await (
      await createProfile(cookie, { display_name: "Kid", avatar_id: 5 })
    ).json()) as any;

    const sel = await post(`/profiles/${created.id}/select`, {}, cookie);
    expect(sel.status).toBe(200);

    // /me now reports kid mode.
    const me = (await (
      await SELF.fetch(`${BASE}/me`, { headers: { cookie } })
    ).json()) as any;
    expect(me.mode).toBe("kid");
    expect(me.profile.id).toBe(created.id);

    // Kid mode is blocked from creating profiles.
    const blocked = await createProfile(cookie, { display_name: "Nope", avatar_id: 6 });
    expect(blocked.status).toBe(403);
    const body = (await blocked.json()) as any;
    expect(body.error.code).toBe("parent_mode_required");
  });

  it("404s for a profile outside the family", async () => {
    const { parentId } = await seedParent();
    const { cookie } = await seedSession(parentId);
    const res = await post(`/profiles/NONEXISTENT/select`, {}, cookie);
    expect(res.status).toBe(404);
  });
});
