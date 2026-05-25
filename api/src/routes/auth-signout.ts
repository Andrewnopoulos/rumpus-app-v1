import type { Ctx } from "../index";
import { buildClearCookie } from "../lib/cookies";
import { json } from "../lib/responses";
import { nowSec } from "../lib/time";
import { deleteKvSession } from "../middleware/session";

/**
 * POST /auth/signout
 * Revokes the current session in D1, drops the KV mirror, and clears the
 * cookie. Idempotent: succeeds even with no active session.
 */
export async function signout(c: Ctx): Promise<Response> {
  const clear = buildClearCookie({ local: c.local });
  const session = c.session;
  if (session) {
    await c.env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id = ?")
      .bind(nowSec(), session.id)
      .run();
    await deleteKvSession(c.env, session.id);
  }
  return json({ ok: true }, { headers: { "Set-Cookie": clear } });
}
