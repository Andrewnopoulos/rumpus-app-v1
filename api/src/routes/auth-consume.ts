import type { Ctx } from "../index";
import { buildSessionCookie, signValue } from "../lib/cookies";
import { sha256hex } from "../lib/hash";
import { errorResponse } from "../lib/responses";
import { DAY, nowSec } from "../lib/time";
import { ulid } from "../lib/ulid";
import { writeKvSession, type SessionRecord } from "../middleware/session";

const SESSION_TTL = 90 * DAY;
const ELEVATION_TTL = 600; // 10 minutes

interface TokenRow {
  id: string;
  parent_id: string;
  purpose: string;
}

/** Redirect to the launcher root, attaching the given Set-Cookie if present. */
function redirectToApp(c: Ctx, setCookie?: string): Response {
  const headers = new Headers({ Location: `${c.env.LAUNCHER_BASE_URL}/` });
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(null, { status: 302, headers });
}

/**
 * GET /auth/consume?token=<raw>
 * Single-use. Magic-link tokens mint a new parent-mode session; elevation
 * tokens raise the current session's elevated_until.
 */
export async function consume(c: Ctx): Promise<Response> {
  const token = c.url.searchParams.get("token");
  if (!token) {
    return errorResponse(400, "invalid_token", "Missing or invalid token.");
  }

  const now = nowSec();
  const tokenHash = await sha256hex(token);

  const row = await c.env.DB.prepare(
    "SELECT id, parent_id, purpose FROM auth_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?",
  )
    .bind(tokenHash, now)
    .first<TokenRow>();
  if (!row) {
    return errorResponse(400, "invalid_token", "This link is invalid or has expired.");
  }

  // Mark consumed up front — single use, even if a later step is a no-op.
  await c.env.DB.prepare("UPDATE auth_tokens SET consumed_at = ? WHERE id = ?")
    .bind(now, row.id)
    .run();

  if (row.purpose === "magic_link") {
    const session: SessionRecord = {
      id: ulid(),
      parent_id: row.parent_id,
      active_profile: null,
      created_at: now,
      last_seen_at: now,
      expires_at: now + SESSION_TTL,
      elevated_until: null,
      user_agent: c.req.headers.get("user-agent"),
    revoked_at: null,
    };
    await c.env.DB.prepare(
      "INSERT INTO sessions (id, parent_id, active_profile, created_at, last_seen_at, expires_at, elevated_until, user_agent, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        session.id,
        session.parent_id,
        session.active_profile,
        session.created_at,
        session.last_seen_at,
        session.expires_at,
        session.elevated_until,
        session.user_agent,
        session.revoked_at,
      )
      .run();
    await writeKvSession(c.env, session);
    await c.env.DB.prepare("UPDATE parents SET last_signed_in_at = ? WHERE id = ?")
      .bind(now, session.parent_id)
      .run();

    const signed = await signValue(session.id, c.secret);
    const cookie = buildSessionCookie(signed, SESSION_TTL, {
      local: c.local,
      domain: c.env.COOKIE_DOMAIN,
    });
    return redirectToApp(c, cookie);
  }

  if (row.purpose === "elevation") {
    // Elevation raises the *current* session. Requires the session cookie to
    // be present and to belong to the same parent as the token.
    const current = c.session;
    if (!current || current.parent_id !== row.parent_id) {
      return errorResponse(
        400,
        "no_session",
        "Open this link in the browser where you started the elevation.",
      );
    }
    const elevatedUntil = now + ELEVATION_TTL;
    await c.env.DB.prepare(
      "UPDATE sessions SET elevated_until = ?, last_seen_at = ? WHERE id = ?",
    )
      .bind(elevatedUntil, now, current.id)
      .run();
    await writeKvSession(c.env, {
      ...current,
      elevated_until: elevatedUntil,
      last_seen_at: now,
    });
    return redirectToApp(c);
  }

  // Unknown / not-yet-built purposes (e.g. invite_accept).
  return errorResponse(400, "invalid_token", "This link is invalid or has expired.");
}
