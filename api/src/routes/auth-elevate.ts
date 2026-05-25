import type { Ctx } from "../index";
import { sendEmail } from "../email/stub";
import { randomToken, sha256hex } from "../lib/hash";
import { errorResponse, json } from "../lib/responses";
import { nowSec } from "../lib/time";
import { ulid } from "../lib/ulid";
import { requireParentMode } from "../middleware/elevation";

const ELEVATION_TOKEN_TTL = 600; // 10 minutes

interface ParentEmailRow {
  email: string;
}

/**
 * POST /auth/elevate
 * Requires a parent-mode session (device-trusted is fine). Issues an
 * elevation token and emails it; consuming it (via /auth/consume) raises the
 * current session to elevated.
 */
export async function elevate(c: Ctx): Promise<Response> {
  const guard = requireParentMode(c.session);
  if (guard) return guard;
  const session = c.session!;

  const now = nowSec();
  const token = randomToken();
  const tokenHash = await sha256hex(token);
  await c.env.DB.prepare(
    "INSERT INTO auth_tokens (id, parent_id, token_hash, purpose, created_at, expires_at) VALUES (?, ?, ?, 'elevation', ?, ?)",
  )
    .bind(ulid(), session.parent_id, tokenHash, now, now + ELEVATION_TOKEN_TTL)
    .run();

  const parent = await c.env.DB.prepare("SELECT email FROM parents WHERE id = ?")
    .bind(session.parent_id)
    .first<ParentEmailRow>();

  if (parent) {
    const link = `${c.env.APP_BASE_URL}/auth/consume?token=${token}`;
    await sendEmail({
      to: parent.email,
      subject: "Confirm it's you — RumpusRoom",
      body: `Link: ${link}`,
    });
  }

  return json({ ok: true });
}
