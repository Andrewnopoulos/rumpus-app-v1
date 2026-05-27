// Cookie parsing and HMAC signing for the session cookie.
//
// The cookie value is the session ID, signed with SESSION_SECRET so a client
// can't forge or tamper with it. Format: `<sessionId>.<base64url(hmac)>`.

import { base64url } from "./hash";

export const COOKIE_NAME = "rr_session";

/** Parse a Cookie header into a name->value map. */
export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign a value, producing `<value>.<sig>`. */
export async function signValue(value: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return `${value}.${base64url(new Uint8Array(sig))}`;
}

/** Verify a signed value. Returns the original value, or null if invalid. */
export async function verifyValue(signed: string, secret: string): Promise<string | null> {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = signed.slice(0, dot);
  const expected = await signValue(value, secret);
  // length-safe constant-time comparison
  if (expected.length !== signed.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signed.charCodeAt(i);
  }
  return diff === 0 ? value : null;
}

/** Default cookie Domain when none is configured (production). */
const DEFAULT_COOKIE_DOMAIN = ".rumpusroom.app";

interface CookieOpts {
  /** Local dev: omit Domain and Secure so the cookie works on localhost. */
  local: boolean;
  /**
   * Cookie Domain for non-local deploys. Defaults to `.rumpusroom.app`.
   * Set to `.staging.rumpusroom.app` to scope sessions to a staging env.
   */
  domain?: string;
}

/** Build a Set-Cookie header that establishes the session. */
export function buildSessionCookie(
  signedValue: string,
  maxAgeSec: number,
  opts: CookieOpts,
): string {
  const parts = [
    `${COOKIE_NAME}=${signedValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (!opts.local) {
    parts.push(`Domain=${opts.domain ?? DEFAULT_COOKIE_DOMAIN}`, "Secure");
  }
  return parts.join("; ");
}

/** Build a Set-Cookie header that clears the session. */
export function buildClearCookie(opts: CookieOpts): string {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (!opts.local) {
    parts.push(`Domain=${opts.domain ?? DEFAULT_COOKIE_DOMAIN}`, "Secure");
  }
  return parts.join("; ");
}
