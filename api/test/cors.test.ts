import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { BASE } from "./helpers";

// Cross-origin credentialed requests come from the launcher and each kid PWA,
// which live on distinct `*.rumpusroom.app` subdomains in production. The API
// must reflect those origins (never `*`, which credentials forbid) and reject
// look-alikes.
function preflight(origin: string) {
  return SELF.fetch(`${BASE}/me`, {
    method: "OPTIONS",
    headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
  });
}

describe("CORS origin allowlist", () => {
  it("reflects a kid PWA subdomain origin", async () => {
    const origin = "https://kaleidoscope.rumpusroom.app";
    const res = await preflight(origin);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("reflects the launcher apex origin", async () => {
    const origin = "https://rumpusroom.app";
    const res = await preflight(origin);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
  });

  it("reflects the launcher dev origin", async () => {
    const origin = "http://localhost:5173";
    const res = await preflight(origin);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
  });

  it("rejects an unrelated origin", async () => {
    const res = await preflight("https://evil.example.com");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rejects domain look-alikes", async () => {
    for (const origin of [
      "https://evilrumpusroom.app",
      "https://rumpusroom.app.evil.com",
      "http://kaleidoscope.rumpusroom.app", // http, not https
    ]) {
      const res = await preflight(origin);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
  });
});
