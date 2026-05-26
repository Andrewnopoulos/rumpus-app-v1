// Worker entry + router for the RumpusRoom API.

import type { Env } from "./env";
import { errorResponse } from "./lib/responses";
import { loadSession, type SessionRecord } from "./middleware/session";
import { health } from "./routes/health";
import { me } from "./routes/me";
import { magicLink } from "./routes/auth-magic-link";
import { consume } from "./routes/auth-consume";
import { elevate } from "./routes/auth-elevate";
import { signout } from "./routes/auth-signout";
import {
  createProfile,
  deselectProfile,
  listProfiles,
  selectProfile,
} from "./routes/profiles";

/** Per-request context passed to every route handler. */
export interface Ctx {
  req: Request;
  env: Env;
  url: URL;
  /** True on localhost: cookies omit Domain and Secure. */
  local: boolean;
  /** Resolved session, or null if unauthenticated. */
  session: SessionRecord | null;
  /** Cookie-signing secret. */
  secret: string;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isLocal(url: URL): boolean {
  return LOCAL_HOSTS.has(url.hostname) || url.hostname.endsWith(".localhost");
}

// Browser origins allowed to call the API with credentials. Cross-origin only
// matters when the launcher calls the API directly (production subdomains, or
// dev without a same-origin proxy). Origin is reflected, never wildcarded —
// `Access-Control-Allow-Credentials: true` forbids `*`.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173", // launcher dev server
  "https://rumpusroom.app", // launcher production
]);

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

/** Append CORS headers to an already-built response, preserving Set-Cookie etc. */
function withCors(res: Response, cors: Record<string, string>): Response {
  if (Object.keys(cors).length === 0) return res;
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

const SELECT_PROFILE = /^\/profiles\/([^/]+)\/select$/;

async function route(c: Ctx): Promise<Response> {
  const { pathname } = c.url;
  const method = c.req.method;

  if (method === "GET" && pathname === "/health") return health(c);
  if (method === "GET" && pathname === "/me") return me(c);
  if (method === "POST" && pathname === "/auth/magic-link") return magicLink(c);
  if (method === "GET" && pathname === "/auth/consume") return consume(c);
  if (method === "POST" && pathname === "/auth/elevate") return elevate(c);
  if (method === "POST" && pathname === "/auth/signout") return signout(c);
  if (method === "POST" && pathname === "/profiles") return createProfile(c);
  if (method === "GET" && pathname === "/profiles") return listProfiles(c);
  if (method === "POST" && pathname === "/profiles/deselect") return deselectProfile(c);

  const selectMatch = SELECT_PROFILE.exec(pathname);
  if (method === "POST" && selectMatch) {
    return selectProfile(c, decodeURIComponent(selectMatch[1]));
  }

  return errorResponse(404, "not_found", "No such endpoint.");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeadersFor(req);

    // CORS preflight: answer before touching session/state.
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      const url = new URL(req.url);
      const secret = env.SESSION_SECRET;
      const session = await loadSession(req, env, secret);
      const c: Ctx = { req, env, url, local: isLocal(url), session, secret };
      return withCors(await route(c), cors);
    } catch (err) {
      console.error("Unhandled error:", err);
      return withCors(errorResponse(500, "internal_error", "Something went wrong."), cors);
    }
  },
} satisfies ExportedHandler<Env>;
