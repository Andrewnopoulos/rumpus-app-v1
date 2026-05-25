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
