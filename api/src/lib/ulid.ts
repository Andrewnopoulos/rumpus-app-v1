// Minimal ULID generator. 26-char Crockford base32: 48-bit timestamp (ms) +
// 80 bits of randomness. Lexicographically sortable, URL-safe. No dependency.

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's base32
const ENCODING_LEN = 32;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(time: number): string {
  let out = "";
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    out = ENCODING[mod] + out;
    time = (time - mod) / ENCODING_LEN;
  }
  return out;
}

function encodeRandom(): string {
  const bytes = new Uint8Array(RANDOM_LEN);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < RANDOM_LEN; i++) {
    out += ENCODING[bytes[i] % ENCODING_LEN];
  }
  return out;
}

/** Generate a 26-char ULID. Optionally seed the timestamp (ms) for testing. */
export function ulid(seedTimeMs?: number): string {
  const t = Math.floor(seedTimeMs ?? Date.now());
  return encodeTime(t) + encodeRandom();
}
