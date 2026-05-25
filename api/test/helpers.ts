import { env } from "cloudflare:test";
import { signValue } from "../src/lib/cookies";
import { sha256hex } from "../src/lib/hash";
import { DAY, nowSec } from "../src/lib/time";
import { ulid } from "../src/lib/ulid";

const SECRET = "test-session-secret"; // matches vitest.config.ts binding

export interface SeededParent {
  parentId: string;
  familyId: string;
}

/** Insert a family + primary parent directly. Returns their IDs. */
export async function seedParent(email = `p-${ulid()}@example.com`): Promise<SeededParent> {
  const familyId = ulid();
  const parentId = ulid();
  const now = nowSec();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO families (id, created_at) VALUES (?, ?)").bind(familyId, now),
    env.DB.prepare(
      "INSERT INTO parents (id, family_id, email, is_primary, created_at) VALUES (?, ?, ?, 1, ?)",
    ).bind(parentId, familyId, email.toLowerCase(), now),
  ]);
  return { parentId, familyId };
}

export interface SeededSession {
  sessionId: string;
  cookie: string; // ready-to-send `rr_session=<signed>`
}

/** Insert a parent-mode session for a parent and return a signed cookie. */
export async function seedSession(
  parentId: string,
  opts: { elevatedUntil?: number | null; activeProfile?: string | null } = {},
): Promise<SeededSession> {
  const sessionId = ulid();
  const now = nowSec();
  await env.DB.prepare(
    "INSERT INTO sessions (id, parent_id, active_profile, created_at, last_seen_at, expires_at, elevated_until, user_agent, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      sessionId,
      parentId,
      opts.activeProfile ?? null,
      now,
      now,
      now + 90 * DAY,
      opts.elevatedUntil ?? null,
      "test-agent",
      null,
    )
    .run();
  const signed = await signValue(sessionId, SECRET);
  return { sessionId, cookie: `rr_session=${signed}` };
}

/** Insert an auth token directly. Returns the raw token to put in a URL. */
export async function seedToken(
  parentId: string,
  purpose: "magic_link" | "elevation",
  opts: { expiresAt?: number; rawToken?: string } = {},
): Promise<string> {
  const raw = opts.rawToken ?? `tok-${ulid()}`;
  const now = nowSec();
  await env.DB.prepare(
    "INSERT INTO auth_tokens (id, parent_id, token_hash, purpose, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(ulid(), parentId, await sha256hex(raw), purpose, now, opts.expiresAt ?? now + 600)
    .run();
  return raw;
}

/** Base URL for SELF.fetch — localhost so cookies omit Domain/Secure. */
export const BASE = "http://localhost";
