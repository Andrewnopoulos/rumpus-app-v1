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
import { createProfile, listProfiles, selectProfile } from "./routes/profiles";

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

const SELECT_PROFILE = /^\/profiles\/([^/]+)\/select$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(req.url);
      const secret = env.SESSION_SECRET;
      const session = await loadSession(req, env, secret);
      const c: Ctx = { req, env, url, local: isLocal(url), session, secret };

      const { pathname } = url;
      const method = req.method;

      if (method === "GET" && pathname === "/health") return health(c);
      if (method === "GET" && pathname === "/me") return me(c);
      if (method === "POST" && pathname === "/auth/magic-link") return magicLink(c);
      if (method === "GET" && pathname === "/auth/consume") return consume(c);
      if (method === "POST" && pathname === "/auth/elevate") return elevate(c);
      if (method === "POST" && pathname === "/auth/signout") return signout(c);
      if (method === "POST" && pathname === "/profiles") return createProfile(c);
      if (method === "GET" && pathname === "/profiles") return listProfiles(c);

      const selectMatch = SELECT_PROFILE.exec(pathname);
      if (method === "POST" && selectMatch) {
        return selectProfile(c, decodeURIComponent(selectMatch[1]));
      }

      return errorResponse(404, "not_found", "No such endpoint.");
    } catch (err) {
      console.error("Unhandled error:", err);
      return errorResponse(500, "internal_error", "Something went wrong.");
    }
  },
} satisfies ExportedHandler<Env>;
