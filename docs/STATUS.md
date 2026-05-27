# RumpusRoom STATUS

### Current state

The API, auth-client, and launcher are built and tested locally (35, 30, and
10 tests). As of this session all three plus the Kaleidoscope kid PWA are
deployed to an isolated staging environment under `*.staging.rumpusroom.app`,
and the cross-subdomain session model — the bet the whole product rests on — is
proven against the live deployment at the contract level.

The API runs at `api.staging.rumpusroom.app` on real D1 and KV. The session
cookie is now scoped by a new `COOKIE_DOMAIN` env var (`.staging.rumpusroom.app`
in staging, default `.rumpusroom.app`), and CORS reflects any https
`.rumpusroom.app` origin. Verified live: a consumed magic-link token issues a
`Domain=.staging.rumpusroom.app; Secure` cookie, `/me` resolves it to parent
mode, entitlements compute (empty when unsubscribed, unlocked via a comped
override), and a preflight from the Kaleidoscope subdomain is reflected with
credentials. Email is still a console stub; no Stripe code beyond the schema.

The auth-client gained a `launcherBase` config (parallel to `apiBase`) so a kid
PWA can redirect to the staging launcher; its IIFE build is vendored into
Kaleidoscope.

The launcher is live at `staging.rumpusroom.app`, built against the staging API.
Kaleidoscope (`colliderscope`) is retrofitted with an env-aware boot gate and
live at `kaleidoscope.staging.rumpusroom.app`; the deployed HTML carries the
gate, and its service-worker cache was bumped so the gated shell wins.

The marketing site and admin console are not started. The other five kid PWAs
are not retrofitted.

### In progress

Browser confirmation of the gate's client-side execution (redirect when
locked/signed-out, boot when entitled). The backend contract is fully verified
headlessly; a signed-in demo family is seeded for a human click-through.

### Next up

Either roll the auth-client retrofit to the next kid PWA, or make the launcher's
app-tile launch URLs env-aware so a full launcher→app click-through works on
staging (they are currently hardcoded to prod subdomains).

### Known issues / debts

- Launcher app-tile `launchUrl`s are hardcoded to prod subdomains, so staging
  tiles point at nonexistent prod URLs. Direct-visit the staging app URL to test.
- Email is a console stub; production sign-in means reading the link from
  `wrangler tail`.
- No Stripe; entitlement is driven by manual comped overrides / subscription rows.
- Top-level `api/wrangler.toml` keeps placeholder D1/KV IDs on purpose — prod
  env not yet created; a bare `wrangler deploy` is meant to fail.
- 12 avatars designed (0–11) but the API reserves 0–19.
- The account API token now holds Zone:DNS:Write on rumpusroom.app/.org (granted
  so the deploy could create Pages custom-domain CNAMEs).

### Last touched

2026-05-27
