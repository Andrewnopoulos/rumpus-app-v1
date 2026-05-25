// Token generation and hashing. Raw tokens are 32 random bytes, base64url
// encoded. We never store the raw token — only its SHA-256 hex digest.

/** Encode bytes as base64url (no padding). */
export function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 of a UTF-8 string, returned as lowercase hex. */
export async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a fresh 32-byte random token, base64url encoded. */
export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}
