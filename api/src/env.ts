// Worker environment bindings. Configured in wrangler.toml (DB, SESSIONS,
// APP_BASE_URL) and as a secret / .dev.vars value (SESSION_SECRET).

export interface Env {
  /** D1 database — durable relational store. */
  DB: D1Database;
  /** KV namespace — session hot-reads, key `session:{id}`. */
  SESSIONS: KVNamespace;
  /** HMAC secret used to sign the session cookie. */
  SESSION_SECRET: string;
  /** Base URL used in magic-link emails and post-consume redirects. */
  APP_BASE_URL: string;
}
