import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { nowSec } from "../src/lib/time";
import { BASE, seedParent, seedSession, seedToken } from "./helpers";

function post(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return SELF.fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("GET /health", () => {
  it("returns ok with a timestamp", async () => {
    const res = await SELF.fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; time: number };
    expect(body.status).toBe("ok");
    expect(typeof body.time).toBe("number");
  });
});

describe("magic link request", () => {
  it("creates parent + family on first use", async () => {
    const email = "new-parent@example.com";
    const res = await post("/auth/magic-link", { email });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    const parent = await env.DB.prepare(
      "SELECT id, family_id, is_primary FROM parents WHERE email = ?",
    )
      .bind(email)
      .first<{ id: string; family_id: string; is_primary: number }>();
    expect(parent).not.toBeNull();
    expect(parent!.is_primary).toBe(1);

    const family = await env.DB.prepare("SELECT id FROM families WHERE id = ?")
      .bind(parent!.family_id)
      .first();
    expect(family).not.toBeNull();
  });

  it("reuses the existing parent on second use", async () => {
    const email = "repeat@example.com";
    await post("/auth/magic-link", { email });
    await post("/auth/magic-link", { email });

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM parents WHERE email = ?",
    )
      .bind(email)
      .first<{ n: number }>();
    expect(count!.n).toBe(1);
  });

  it("normalizes email case", async () => {
    await post("/auth/magic-link", { email: "MixedCase@Example.com" });
    const parent = await env.DB.prepare("SELECT email FROM parents WHERE email = ?")
      .bind("mixedcase@example.com")
      .first();
    expect(parent).not.toBeNull();
  });

  it("rejects an invalid email", async () => {
    const res = await post("/auth/magic-link", { email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("rate limits after 5 sends in the window", async () => {
    const email = "ratelimited@example.com";
    for (let i = 0; i < 5; i++) {
      const ok = await post("/auth/magic-link", { email });
      expect(ok.status).toBe(200);
    }
    const sixth = await post("/auth/magic-link", { email });
    expect(sixth.status).toBe(429);
    const body = (await sixth.json()) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
  });
});

describe("magic link consume", () => {
  it("creates a session for a valid token", async () => {
    const { parentId } = await seedParent();
    const raw = await seedToken(parentId, "magic_link", { expiresAt: nowSec() + 600 });

    const res = await SELF.fetch(`${BASE}/auth/consume?token=${raw}`, { redirect: "manual" });
    expect(res.status).toBe(302);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("rr_session=");

    const session = await env.DB.prepare(
      "SELECT parent_id, active_profile FROM sessions WHERE parent_id = ?",
    )
      .bind(parentId)
      .first<{ parent_id: string; active_profile: string | null }>();
    expect(session).not.toBeNull();
    expect(session!.active_profile).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { parentId } = await seedParent();
    const raw = await seedToken(parentId, "magic_link", { expiresAt: nowSec() - 10 });
    const res = await SELF.fetch(`${BASE}/auth/consume?token=${raw}`, { redirect: "manual" });
    expect(res.status).toBe(400);
  });

  it("rejects a token used twice", async () => {
    const { parentId } = await seedParent();
    const raw = await seedToken(parentId, "magic_link", { expiresAt: nowSec() + 600 });

    const first = await SELF.fetch(`${BASE}/auth/consume?token=${raw}`, { redirect: "manual" });
    expect(first.status).toBe(302);
    const second = await SELF.fetch(`${BASE}/auth/consume?token=${raw}`, { redirect: "manual" });
    expect(second.status).toBe(400);
  });
});

describe("elevation flow", () => {
  it("elevates the current session for ~10 minutes on consume", async () => {
    const { parentId } = await seedParent();
    const { sessionId, cookie } = await seedSession(parentId);

    // Request elevation (issues + emails a token).
    const reqRes = await post("/auth/elevate", undefined, { cookie });
    expect(reqRes.status).toBe(200);

    // The raw token isn't returned by the API; seed one directly to consume.
    const raw = await seedToken(parentId, "elevation", { expiresAt: nowSec() + 600 });
    const before = nowSec();
    const consumeRes = await SELF.fetch(`${BASE}/auth/consume?token=${raw}`, {
      headers: { cookie },
      redirect: "manual",
    });
    expect(consumeRes.status).toBe(302);

    const session = await env.DB.prepare(
      "SELECT elevated_until FROM sessions WHERE id = ?",
    )
      .bind(sessionId)
      .first<{ elevated_until: number | null }>();
    expect(session!.elevated_until).not.toBeNull();
    expect(session!.elevated_until!).toBeGreaterThanOrEqual(before + 590);
    expect(session!.elevated_until!).toBeLessThanOrEqual(before + 610);
  });

  it("rejects elevate without a parent session", async () => {
    const res = await post("/auth/elevate");
    expect(res.status).toBe(401);
  });
});

describe("signout", () => {
  it("revokes the session and clears the cookie", async () => {
    const { parentId } = await seedParent();
    const { sessionId, cookie } = await seedSession(parentId);

    const res = await post("/auth/signout", undefined, { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");

    const session = await env.DB.prepare("SELECT revoked_at FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<{ revoked_at: number | null }>();
    expect(session!.revoked_at).not.toBeNull();
  });
});
