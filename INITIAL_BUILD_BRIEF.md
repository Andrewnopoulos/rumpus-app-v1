# RumpusRoom API — initial build brief

You're building the foundational layer of the RumpusRoom API, a Cloudflare
Worker that serves a paid kid-software ecosystem. This brief is scoped
deliberately: build only what's described here. Do not add Stripe integration,
do not add real email sending, do not build any UI. Those are separate sessions.

## Stack

- Cloudflare Workers (TypeScript)
- Cloudflare D1 (SQLite) for relational data
- Cloudflare KV for session hot-reads
- Wrangler for local dev and deploy
- Vitest for tests, using `@cloudflare/vitest-pool-workers`

## Repo layout to create
api/
├── package.json
├── tsconfig.json
├── wrangler.toml
├── vitest.config.ts
├── migrations/
│   └── 0001_initial.sql
├── src/
│   ├── index.ts                 # Worker entry, router
│   ├── env.ts                   # Env type definition
│   ├── lib/
│   │   ├── ulid.ts              # ULID generation
│   │   ├── time.ts              # Unix timestamp helpers
│   │   ├── hash.ts              # SHA-256 for token hashing
│   │   ├── cookies.ts           # Cookie parsing and signing
│   │   └── responses.ts         # JSON response helpers, error shapes
│   ├── middleware/
│   │   ├── session.ts           # Reads session cookie, hydrates session from KV/D1
│   │   └── elevation.ts         # Requires elevated session for sensitive routes
│   ├── routes/
│   │   ├── health.ts            # GET /health
│   │   ├── me.ts                # GET /me
│   │   ├── auth-magic-link.ts   # POST /auth/magic-link (request)
│   │   ├── auth-consume.ts      # GET /auth/consume?token=...
│   │   ├── auth-elevate.ts      # POST /auth/elevate (request elevation link)
│   │   ├── auth-signout.ts      # POST /auth/signout
│   │   └── profiles.ts          # POST /profiles, GET /profiles, POST /profiles/:id/select
│   └── email/
│       └── stub.ts              # Logs email content; real provider added later
└── test/
├── auth.test.ts
├── me.test.ts
└── profiles.test.ts

## Schema

Create `migrations/0001_initial.sql` with exactly the following schema. Do not
modify the schema; if you think there's a problem, ask before changing.

-- ============================================================
-- RumpusRoom D1 schema, v1
-- All IDs are ULIDs (26-char text, sortable, URL-safe)
-- All timestamps are Unix epoch seconds, UTC
-- ============================================================

-- A family is the billing unit and the container for everything.
CREATE TABLE families (
  id              TEXT PRIMARY KEY,
  display_name    TEXT,                       -- optional, parent-set, e.g. "The Smiths"
  created_at      INTEGER NOT NULL,
  deleted_at      INTEGER,                    -- soft-delete; cron hard-purges after 90 days
  cancelled_at    INTEGER                     -- when subscription was cancelled, drives 90-day window
);

-- Parents are the human users. One or two per family in practice; schema doesn't cap.
CREATE TABLE parents (
  id                              TEXT PRIMARY KEY,
  family_id                       TEXT NOT NULL,           -- FK families.id
  email                           TEXT NOT NULL UNIQUE,    -- lowercased before insert
  display_name                    TEXT,                    -- optional, shown in co-parent UI
  is_primary                      INTEGER NOT NULL DEFAULT 0, -- the parent who set up billing
  password_hash                   TEXT,                    -- NULL if magic-link-only (default)
  created_at                      INTEGER NOT NULL,
  last_signed_in_at               INTEGER,
  deleted_at                      INTEGER,
  -- Rate limiting for magic link sends
  magic_link_window_started_at    INTEGER,
  magic_link_count_in_window      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_parents_family ON parents(family_id);

-- Pending co-parent invites. Removed on accept or expiry.
CREATE TABLE parent_invites (
  id              TEXT PRIMARY KEY,
  family_id       TEXT NOT NULL,
  invited_email   TEXT NOT NULL,
  invited_by      TEXT NOT NULL,              -- FK parents.id
  token_hash      TEXT NOT NULL UNIQUE,       -- sha256 of the URL token, never store raw
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,           -- typically created_at + 7 days
  accepted_at     INTEGER
);
CREATE INDEX idx_parent_invites_family ON parent_invites(family_id);

-- Kid profiles. No login, no PII beyond display name.
CREATE TABLE kid_profiles (
  id              TEXT PRIMARY KEY,
  family_id       TEXT NOT NULL,
  display_name    TEXT NOT NULL,              -- not unique within family by design
  avatar_id       INTEGER NOT NULL,           -- references code-defined avatar list
  age_band        TEXT,                       -- optional: 'under_5', '5_7', '8_10', set by parent
  created_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);
CREATE INDEX idx_kid_profiles_family ON kid_profiles(family_id);

-- Magic links and elevation tokens. Single-use, short TTL.
CREATE TABLE auth_tokens (
  id              TEXT PRIMARY KEY,
  parent_id       TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,       -- sha256 of the URL token
  purpose         TEXT NOT NULL,              -- 'magic_link' | 'elevation' | 'invite_accept'
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,
  consumed_at     INTEGER                     -- NULL until used; single-use enforced in code
);
CREATE INDEX idx_auth_tokens_parent ON auth_tokens(parent_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);

-- Active sessions. Cookie value is the session ID; KV stores the full session for fast reads.
-- D1 row is the durable record for audit and revocation.
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,           -- also the cookie value (signed)
  parent_id       TEXT NOT NULL,
  active_profile  TEXT,                       -- FK kid_profiles.id, NULL when parent-mode
  created_at      INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,           -- ~90 days for device-trusted sessions
  elevated_until  INTEGER,                    -- timestamp until which sensitive actions allowed
  user_agent      TEXT,                       -- for the "active devices" UI
  revoked_at      INTEGER
);
CREATE INDEX idx_sessions_parent ON sessions(parent_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Subscription state mirrored from Stripe. Webhooks keep this fresh.
CREATE TABLE subscriptions (
  id                          TEXT PRIMARY KEY,
  family_id                   TEXT NOT NULL UNIQUE,        -- one sub per family
  stripe_customer_id          TEXT NOT NULL UNIQUE,
  stripe_subscription_id      TEXT UNIQUE,                 -- NULL during trial-before-checkout
  status                      TEXT NOT NULL,               -- 'trialing' | 'active' | 'past_due' | 'cancelled' | 'unpaid'
  plan                        TEXT,                        -- 'monthly' | 'annual'
  current_period_start        INTEGER,
  current_period_end          INTEGER,
  cancel_at_period_end        INTEGER NOT NULL DEFAULT 0,
  grace_period_ends_at        INTEGER,                     -- for 14-day dunning
  created_at                  INTEGER NOT NULL,
  updated_at                  INTEGER NOT NULL
);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Per-family per-app overrides. No row = default behaviour (unlocked if subscribed).
-- Lets you comp individual apps or kill-switch an app for one family.
CREATE TABLE family_app_overrides (
  family_id       TEXT NOT NULL,
  app_slug        TEXT NOT NULL,              -- 'mr-know-it-all', 'kaleidoscope', etc.
  state           TEXT NOT NULL,              -- 'comped' | 'disabled'
  reason          TEXT,                       -- free-text for admin notes
  expires_at      INTEGER,                    -- NULL = permanent
  created_at      INTEGER NOT NULL,
  created_by      TEXT,                       -- admin email
  PRIMARY KEY (family_id, app_slug)
);

-- Per-kid app toggles. Schema supports it; v1 UI doesn't expose it.
-- No row = app available to that kid. Row with allowed=0 hides it.
CREATE TABLE kid_app_settings (
  profile_id      TEXT NOT NULL,
  app_slug        TEXT NOT NULL,
  allowed         INTEGER NOT NULL DEFAULT 1,
  updated_at      INTEGER NOT NULL,
  PRIMARY KEY (profile_id, app_slug)
);

-- Usage events, one row per metered action. Currently only Mr Know-it-all voice turns.
-- Aggregate on read for quota checks; could pre-aggregate later if D1 reads get expensive.
CREATE TABLE usage_events (
  id              TEXT PRIMARY KEY,
  family_id       TEXT NOT NULL,
  profile_id      TEXT,                       -- which kid; NULL if profile not selected
  app_slug        TEXT NOT NULL,
  event_type      TEXT NOT NULL,              -- 'mr_know_voice_turn' for now
  cost_units      INTEGER NOT NULL DEFAULT 1, -- abstract units; voice turns = 1
  metadata_json   TEXT,                       -- optional: tokens used, audio length, etc.
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_usage_events_family_created ON usage_events(family_id, created_at);
CREATE INDEX idx_usage_events_profile_created ON usage_events(profile_id, created_at);

-- Stripe webhook idempotency. Insert on receive, return early if already present.
CREATE TABLE stripe_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  received_at     INTEGER NOT NULL,
  processed_at    INTEGER,
  payload_json    TEXT                        -- for debugging; can truncate or drop after 30 days
);

-- Audit log for sensitive actions. Append-only; never delete.
CREATE TABLE audit_events (
  id              TEXT PRIMARY KEY,
  family_id       TEXT,                       -- nullable for system-level events
  actor_type      TEXT NOT NULL,              -- 'parent' | 'admin' | 'system' | 'stripe'
  actor_id        TEXT,                       -- parent_id, admin email, etc.
  action          TEXT NOT NULL,              -- 'subscription.cancelled', 'profile.deleted', etc.
  target_type     TEXT,                       -- 'profile' | 'subscription' | 'parent' | etc.
  target_id       TEXT,
  metadata_json   TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_audit_family ON audit_events(family_id, created_at);

## Conventions

- All IDs are ULIDs (26-char text), generated server-side. Use a small ULID
  implementation in `lib/ulid.ts` — do not pull in a heavy dependency.
- All timestamps are Unix epoch seconds (integer), UTC. Helpers in `lib/time.ts`.
- All tokens (magic link, elevation, invite) are 32 random bytes, base64url
  encoded, never stored raw. Store SHA-256 hash in `auth_tokens.token_hash`.
- All endpoints return JSON. Error shape: `{ error: { code: string, message: string } }`.
- Cookie name: `rr_session`. Scope: `Domain=.rumpusroom.app; Path=/; HttpOnly;
  Secure; SameSite=Lax`. In local dev (`wrangler dev`), Secure is omitted.
- Session cookie value is the session ID. Sessions live in D1 as durable record,
  mirrored to KV with key `session:{id}` for fast hot-reads on `/me`.
- KV session TTL matches D1 `sessions.expires_at`. On any sensitive change
  (revoke, elevation), update both D1 and KV.

## Session model

Three session modes, distinguished by columns on `sessions`:

- **Kid mode**: `active_profile` is set, `elevated_until` is null or past.
  Cannot access parent dashboard or sensitive routes.
- **Parent mode, device-trusted**: `active_profile` is null, `elevated_until`
  is null or past. Can access parent dashboard but not sensitive routes.
- **Parent mode, elevated**: `active_profile` is null, `elevated_until` is in
  the future. Can access sensitive routes (billing, account, data, deletion).

Implement two middlewares:

- `requireParentMode(req)` — rejects if session has an active_profile.
- `requireElevated(req)` — rejects if session is not in parent mode AND
  elevated_until > now.

## Endpoints to build

### `GET /health`
Returns `{ status: "ok", time: <unix-seconds> }`. No auth.

### `GET /me`
Reads the session cookie, returns the session state. Three response shapes:

Unauthenticated:
```json
{ "authenticated": false }
```

Parent mode (device-trusted or elevated):
```json
{
  "authenticated": true,
  "mode": "parent",
  "elevated": false,
  "parent": { "id": "...", "email": "...", "display_name": "..." },
  "family": { "id": "...", "display_name": "..." },
  "co_parents": [{ "id": "...", "email": "...", "display_name": "..." }],
  "profiles": [
    { "id": "...", "display_name": "...", "avatar_id": 3, "display_order": 0 }
  ],
  "subscription": {
    "status": "trialing|active|past_due|cancelled|unpaid|none",
    "plan": "monthly|annual|null",
    "current_period_end": 1234567890
  },
  "entitlements": {
    "apps_unlocked": ["mr-know-it-all", "kaleidoscope", "..."]
  }
}
```

Kid mode:
```json
{
  "authenticated": true,
  "mode": "kid",
  "profile": { "id": "...", "display_name": "...", "avatar_id": 3 },
  "family_id": "...",
  "entitlements": { "apps_unlocked": [...] }
}
```

For v1, `entitlements.apps_unlocked` returns a hardcoded list of all known
app slugs when subscription status is `trialing` or `active`, an empty list
otherwise, with `family_app_overrides` applied (disabled removes, comped adds).
Hardcode the app slug list in code: `['mr-know-it-all', 'kaleidoscope-camera',
'flipa-clone', 'talking-tom-clone', 'filter-app', 'dinner-planner']`.

### `POST /auth/magic-link`
Body: `{ "email": "parent@example.com" }`.
- Lowercases email.
- Rate limit check: if `parents.magic_link_count_in_window >= 5` within the
  last 15 minutes, reject with 429.
- Look up or create a parent record. New parent → also create a family record
  and link them; mark as `is_primary = 1`.
- Generate a 32-byte token, store SHA-256 hash in `auth_tokens` with
  `purpose = 'magic_link'`, `expires_at = now + 900` (15 min).
- Call `email/stub.ts` to "send" the link. Stub logs:
  `[EMAIL] To: <email> | Link: https://rumpusroom.app/auth/consume?token=<raw>`.
- Always returns `{ ok: true }` regardless of whether the email exists
  (no account-enumeration leak).

### `GET /auth/consume?token=<raw>`
- Hash the token, look up in `auth_tokens` where `purpose='magic_link'`,
  `consumed_at IS NULL`, `expires_at > now`.
- If not found → 400 invalid/expired.
- Mark `consumed_at = now`.
- Create a session: `expires_at = now + 90 days`, `active_profile = NULL`,
  `elevated_until = NULL`. Insert into D1 and KV.
- Set the `rr_session` cookie. Redirect to `https://rumpusroom.app/`.

### `POST /auth/elevate`
Requires existing parent-mode session (device-trusted is fine).
- Generates a new token with `purpose = 'elevation'`, `expires_at = now + 600`.
- Sends via email stub.
- Returns `{ ok: true }`.

The corresponding consume endpoint is the same `/auth/consume`, just with
different purpose handling: an elevation token, when consumed, updates the
current session's `elevated_until = now + 600` and redirects back. Detect
purpose from the auth_tokens row.

### `POST /auth/signout`
- Marks current session `revoked_at = now`, removes from KV, clears cookie.
- Returns `{ ok: true }`.

### `POST /profiles`
Requires parent mode (device-trusted is fine).
Body: `{ "display_name": "Alex", "avatar_id": 3, "age_band": "5_7" }`
- Validates display_name (1-30 chars, trimmed, non-empty after trim).
- Validates avatar_id is an integer 0-19 (range hardcoded for v1).
- If avatar_id is already used by another profile in the family, return 409
  with a suggestion of the next unused avatar_id.
- Sets `display_order = (max existing in family) + 1`.
- Returns the created profile.

### `GET /profiles`
Requires parent mode. Returns all non-deleted profiles for the family, sorted
by `display_order`.

### `POST /profiles/:id/select`
Requires parent-mode session. Sets `sessions.active_profile = :id`, drops
elevation (`elevated_until = NULL`). The same session is now in kid mode
until the parent signs out, switches profile, or re-elevates. Updates KV.

Note: profile *deletion* is a sensitive action (requires elevation) and is
not in this brief. Build it in a later session.

## Email stub

`src/email/stub.ts` exports a single function `sendEmail({ to, subject, body })`
that logs to console with a clear `[EMAIL]` prefix. Build with a clean interface
so a real provider drops in later.

## Tests

Use `@cloudflare/vitest-pool-workers` for tests that exercise the Worker
against a local D1. Cover at least:

- Health endpoint returns ok.
- Magic link request creates parent + family on first use.
- Magic link request reuses existing parent on second use.
- Magic link rate limit kicks in after 5 in 15 minutes.
- Consuming a valid token creates a session.
- Consuming an expired token fails.
- Consuming a token twice fails.
- `/me` returns unauthenticated without cookie.
- `/me` returns parent mode after sign-in.
- Profile creation works; duplicate avatar returns 409 with suggestion.
- Profile selection puts session into kid mode.
- Kid mode session blocked from `POST /profiles` (parent mode required).
- Elevation flow: request, consume, session is elevated for 10 min.

## What NOT to build in this session

- Stripe integration (any of it — no webhook handler, no checkout, no customer
  creation). Subscription rows will be created manually in dev for now.
- Real email sending. The stub is correct for now.
- Profile deletion, account deletion, data export. All sensitive; later session.
- Co-parent invite flow. Later session.
- Admin console or admin endpoints.
- Mr Know-it-all usage recording. Later session.
- Anything frontend.

## Definition of done

- `wrangler dev` runs the Worker locally with a local D1.
- Migration applies cleanly.
- All listed tests pass.
- Manually: I can hit `POST /auth/magic-link` with my email, see the link in
  the console log, paste it into a browser, get a session cookie, hit `/me`
  and see parent mode, create a profile, select it, hit `/me` and see kid mode.

## Questions

If anything in this brief is ambiguous, ask before building. If you think
something is wrong, flag it before changing it.