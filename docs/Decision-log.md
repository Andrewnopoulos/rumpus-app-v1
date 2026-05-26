# RumpusRoom Decisions Log

Append-only. One line of rationale per decision.

## 2026-05

- Bundle strategy over standalone Mr Know-it-all. Reframed as "safe app
  drawer for kids' tablets" rather than app collection; the launcher is
  the product, apps are content. Mr Know-it-all is the marquee feature.
- Co-parent access free from day one. Two-parent households shouldn't
  feel locked out; reduces support burden and improves word-of-mouth.
- Unlimited kid profiles, not a pricing lever. Cost to us is zero;
  capping feels stingy and breaks the "family software" framing.
- Magic link as default auth, password optional, Google sign-in later.
  Lowest signup-abandonment path; Google can wait until post-launch.
- No card required for trial. Trial = a few minutes of preview per kid
  app rather than a full timed trial. Reduces tire-kicker friction and
  converts on actual demonstrated kid engagement.
- Monthly + annual pricing, annual ~30% off. Two tiers, not five.
  Annual discount is real value and reduces churn.
- Hard quota on Mr Know-it-all, no overage billing. Bill shock kills
  trust faster than unlimited drives revenue.
- 14-day dunning grace, degrade-don't-cut. Card declines are usually
  boring; sudden cutoffs feel hostile.
- 90-day data retention post-cancel, then hard delete. Kind to returning
  users, APP-compliant, finite liability window.
- Collect minimum data on kids: display name + preset avatar only. No
  birthdate, no photo upload, no real name required. Privacy as product.
- Parent-anchored sessions with kid profile selection (not kid logins,
  not pure device-pairing). Kids never type passwords; parents re-auth
  for sensitive actions; per-profile metering and app toggles possible.
- Subdomain split: .org for marketing, .app for product. Auth cookies
  scoped cleanly to .app; marketing stays cookie-light.


## 2026-05 (schema)

- Sensitive-actions elevation baked in from v1. Long-lived device session
  + short-lived elevated token for billing/account/data actions. One extra
  column on sessions; retrofitting later would touch every auth check.
- Skip per-app entitlements table. Bundle unlocks everything; use a
  family_app_overrides table only for comps and kill switches.
- No display-name uniqueness within family. Twins exist; let parents
  disambiguate however they like.
- Magic link rate limiting via columns on parents table, not separate table.
- Stripe webhook idempotency via dedicated stripe_webhook_events table,
  unique on stripe_event_id.
- All IDs are ULIDs (text), all timestamps are Unix epoch seconds UTC.
- Soft-delete via deleted_at columns + cron purge after 90 days.
- Per-kid app toggles supported in schema (kid_app_settings table) but no
  UI in v1; every kid sees every paid app initially.
- Admin gating by email allowlist in Worker config for v1; no admins table.

- Three session modes, not two: kid mode (profile selected, no admin paths
  reachable), parent mode device-trusted (most dashboard actions), parent
  mode elevated (billing, account, data, deletion). UI hides admin paths
  in kid mode; API enforces elevation on sensitive endpoints regardless.
- kid_profiles.display_order is parent-controlled; profile picker sorts by it.
  Avatar distinctness on profile creation enforced in application code
  (default to next unused avatar), not in schema.
- Global app kill-switch handled via KV flag in Worker, not per-family
  override table. family_app_overrides is for per-family comp and disable only.
- Multi-device simultaneous use supported by design. Mr Know-it-all quota
  enforced server-side per voice turn with KV counter for low-latency concurrent
  checks; race conditions resolve to "first request wins, second sees exhausted".

- Kid profile ordering by created_at ASC, not a separate display_order column.
  Reorder UI isn't a v1 feature; one-column migration covers it later if needed.

- Auth client cache model is fresh-or-cache-on-failure, not stale-while-
  revalidate. Past TTL blocks on fresh fetch; cache only serves on
  network failure. Right for security/billing boundary; flag misnamed
  in initial build and to be renamed `allowStaleFallback`.
- No cross-tab or real-time entitlement updates in v1. Kid PWAs run on
  different devices from the parent dashboard, so storage events don't
  apply. Changes propagate on next /me fetch (app launch or after TTL).


- Launcher stack: Vite + React + TypeScript + Tailwind. SPA, not SSR.
  React Router for routes. No state library, no UI library, no animation
  library in v0. Designed pass replaces placeholders later.
- Launcher does not gate on entitlements — works for any authenticated
  user. Entitlements drive which apps appear in the grid, not launcher access.
- Profile deselect endpoint added to API to support "switch profile" from
  kid mode without requiring parent re-auth. Kid mode tile is a modal
  confirmation, not a hidden action.


## 2026-05 (launcher build)

- /profiles/deselect requires no elevation. Leaving kid mode is not a
  sensitive action; gating it would strand a kid behind an email link.
  Guard is "must be in kid mode" (the inverse of the parent-mode guard).
- Dev wiring is a Vite same-origin proxy, not direct cross-origin. The API
  reuses one APP_BASE_URL for both the magic-link URL and the post-consume
  redirect; proxying /auth /me /profiles /health from the launcher onto the
  API keeps the whole sign-in round trip on one origin with zero API auth
  change. auth-client uses an empty apiBase in dev. (Prod coupling deferred —
  see open questions.)
- CORS added to the API regardless: credentialed, origin-reflected, never
  `*` (allow-credentials forbids wildcard). Allowlist localhost:5173 (dev)
  and rumpusroom.app (prod). Exercised only in production, where launcher and
  API are different subdomains.
- Launcher styling ports the locked design's own CSS (tokens + component
  classes from theme.css) into the production stylesheet. Tailwind is wired
  (oklch vars → colour utilities) and available, but the design classes carry
  the locked look — guarantees fidelity and keeps palette switching a single
  `data-palette` attribute swap, vs re-deriving every component as utilities.
- Default palette is Clay, switchable via one constant in App.tsx. Dark mode
  (data-dark) is defined for parent screens but not toggled in v0.
- Parent dashboard fetches GET /profiles for the richer profile rows
  (age_band, created_at); /me's parent-mode profiles carry only id/name/
  avatar. Falls back to the /me profiles if that call fails.
- Entitlement filtering is client-side in the app grid: the launcher renders
  the static app catalogue filtered by /me's apps_unlocked. Server stays the
  source of truth; the catalogue (names, icons, launch URLs) is launcher data.