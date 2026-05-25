import type { Ctx } from "../index";
import { sendEmail } from "../email/stub";
import { randomToken, sha256hex } from "../lib/hash";
import { errorResponse, json, readJsonBody } from "../lib/responses";
import { nowSec } from "../lib/time";
import { ulid } from "../lib/ulid";

const MAGIC_LINK_TTL = 900; // 15 minutes
const RATE_WINDOW = 900; // 15 minutes
const RATE_MAX = 5; // sends per window

interface ParentRateRow {
  id: string;
  magic_link_window_started_at: number | null;
  magic_link_count_in_window: number;
}

// Pragmatic email check: non-empty, single @, something either side.
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /auth/magic-link  { email }
 * Looks up or creates a parent (+ family on first use), rate-limits sends,
 * issues a single-use magic-link token, and "sends" it via the email stub.
 * Always returns { ok: true } (except on rate limit) to avoid account
 * enumeration.
 */
export async function magicLink(c: Ctx): Promise<Response> {
  const body = await readJsonBody<{ email?: unknown }>(c.req);
  const rawEmail = typeof body?.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return errorResponse(400, "invalid_email", "A valid email address is required.");
  }

  const now = nowSec();

  // Find or create the parent (and family on first sight of this email).
  let parent = await c.env.DB.prepare(
    "SELECT id, magic_link_window_started_at, magic_link_count_in_window FROM parents WHERE email = ?",
  )
    .bind(email)
    .first<ParentRateRow>();

  if (!parent) {
    const familyId = ulid();
    const parentId = ulid();
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO families (id, created_at) VALUES (?, ?)").bind(
        familyId,
        now,
      ),
      c.env.DB.prepare(
        "INSERT INTO parents (id, family_id, email, is_primary, created_at, magic_link_count_in_window) VALUES (?, ?, ?, 1, ?, 0)",
      ).bind(parentId, familyId, email, now),
    ]);
    parent = {
      id: parentId,
      magic_link_window_started_at: null,
      magic_link_count_in_window: 0,
    };
  }

  // Rate-limit window bookkeeping.
  let windowStart = parent.magic_link_window_started_at;
  let count = parent.magic_link_count_in_window;
  if (windowStart === null || now - windowStart >= RATE_WINDOW) {
    windowStart = now;
    count = 0;
  }
  if (count >= RATE_MAX) {
    return errorResponse(
      429,
      "rate_limited",
      "Too many magic-link requests. Please wait a few minutes and try again.",
    );
  }
  count += 1;
  await c.env.DB.prepare(
    "UPDATE parents SET magic_link_window_started_at = ?, magic_link_count_in_window = ? WHERE id = ?",
  )
    .bind(windowStart, count, parent.id)
    .run();

  // Issue the token: store only its hash.
  const token = randomToken();
  const tokenHash = await sha256hex(token);
  await c.env.DB.prepare(
    "INSERT INTO auth_tokens (id, parent_id, token_hash, purpose, created_at, expires_at) VALUES (?, ?, ?, 'magic_link', ?, ?)",
  )
    .bind(ulid(), parent.id, tokenHash, now, now + MAGIC_LINK_TTL)
    .run();

  const link = `${c.env.APP_BASE_URL}/auth/consume?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Your RumpusRoom sign-in link",
    body: `Link: ${link}`,
  });

  return json({ ok: true });
}
