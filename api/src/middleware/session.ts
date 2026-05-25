// Session middleware: read the rr_session cookie, verify its signature, and
// hydrate the session record from KV (hot path) falling back to D1 (durable).

import type { Env } from "../env";
import { COOKIE_NAME, parseCookies, verifyValue } from "../lib/cookies";
import { nowSec } from "../lib/time";

/** Mirrors the `sessions` D1 row. Also the JSON shape cached in KV. */
export interface SessionRecord {
  id: string;
  parent_id: string;
  active_profile: string | null;
  created_at: number;
  last_seen_at: number;
  expires_at: number;
  elevated_until: number | null;
  user_agent: string | null;
  revoked_at: number | null;
}

const kvKey = (id: string) => `session:${id}`;

/** Write (or refresh) the KV mirror, with TTL matching the session expiry. */
export async function writeKvSession(env: Env, session: SessionRecord): Promise<void> {
  const ttl = session.expires_at - nowSec();
  if (ttl <= 0) return;
  // KV requires expirationTtl >= 60.
  const expirationTtl = Math.max(ttl, 60);
  await env.SESSIONS.put(kvKey(session.id), JSON.stringify(session), { expirationTtl });
}

/** Remove the KV mirror (on revoke / signout). */
export async function deleteKvSession(env: Env, id: string): Promise<void> {
  await env.SESSIONS.delete(kvKey(id));
}

function isLive(session: SessionRecord, now: number): boolean {
  return !session.revoked_at && session.expires_at > now;
}

/**
 * Resolve the current session from the request cookie, or null if there is no
 * valid session. Reads KV first; on a miss, reads D1 and repopulates KV.
 */
export async function loadSession(
  req: Request,
  env: Env,
  secret: string,
): Promise<SessionRecord | null> {
  const raw = parseCookies(req.headers.get("cookie"))[COOKIE_NAME];
  if (!raw) return null;

  const sessionId = await verifyValue(raw, secret);
  if (!sessionId) return null;

  const now = nowSec();

  const cached = (await env.SESSIONS.get(kvKey(sessionId), "json")) as SessionRecord | null;
  if (cached) {
    return isLive(cached, now) ? cached : null;
  }

  const row = await env.DB.prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(sessionId)
    .first<SessionRecord>();
  if (!row || !isLive(row, now)) return null;

  await writeKvSession(env, row);
  return row;
}
