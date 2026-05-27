// Worker environment bindings. Configured in wrangler.toml (DB, SESSIONS,
// API_BASE_URL, LAUNCHER_BASE_URL) and as a secret / .dev.vars value
// (SESSION_SECRET).

export interface Env {
  /** D1 database — durable relational store. */
  DB: D1Database;
  /** KV namespace — session hot-reads, key `session:{id}`. */
  SESSIONS: KVNamespace;
  /** HMAC secret used to sign the session cookie. */
  SESSION_SECRET: string;
  /** Origin of this API; the `/auth/consume` link in magic-link emails. */
  API_BASE_URL: string;
  /** Origin of the launcher; the post-consume redirect target. */
  LAUNCHER_BASE_URL: string;
  /**
   * Cookie Domain for the session cookie on non-local deploys, e.g.
   * `.rumpusroom.app` (prod) or `.staging.rumpusroom.app` (isolated staging).
   * Optional; defaults to `.rumpusroom.app` when unset.
   */
  COOKIE_DOMAIN?: string;
}
