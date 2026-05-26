# RumpusRoom STATUS

### Current state

The API (Cloudflare Worker, D1, KV) runs the whole auth surface: magic-link request and consume, session elevation, signout, `/me`, and profile create/list/select/deselect. The single migration matches the schema decisions, sessions resolve from KV with a D1 fallback, and entitlements compute from subscription status plus family overrides. Email is still a console stub; there is no Stripe code beyond the schema tables. CORS is wired for the launcher's cross-origin production case. 30 tests pass.

The auth-client library builds all four outputs (ESM, CJS, IIFE, types) and wraps `/me` with the fresh-or-cache-on-failure model. 29 tests pass.

The launcher PWA is the most complete piece. All seven routes (SignIn, SignInSent, ProfilePicker, AppGrid, ParentDashboard, Locked, Loading) plus the add- and switch-profile modals are built and tested end-to-end against the live API. The locked design pass has landed — the prototype's oklch palettes and Instrument Serif / Manrope fonts are ported in, not placeholder Tailwind. The PWA manifest and service worker are present and valid. auth-client is consumed via a `file:../auth-client` dependency. 10 tests pass.

The marketing site (rumpusroom.org) and admin console (admin.rumpusroom.app) are not started — no directories exist. None of the six kid PWAs has been wired to the auth-client; App-catalogue.md lists every one as "Auth-client integration: Not started."

### In progress

Nothing in active flight. The launcher build wrapped; remaining work is either deferred or not yet begun.

### Next up

Pilot the auth-client retrofit on Kaleidoscope camera — App-catalogue.md flags it as the simplest candidate, and it proves the cross-subdomain session before the harder apps. Separately, resolve the production `APP_BASE_URL` split (below) before any deploy.

### Known issues / debts

- Production `APP_BASE_URL` reuse: one env var serves both the magic-link consume URL and the post-consume redirect. A dev Vite proxy hides this on one origin; production needs the consume link on the API and the redirect on the launcher. Needs a deployment decision (two env vars, or fronting `/auth/consume` on the launcher).
- Email is a console stub; no real provider (Resend/Postmark) is wired.
- No Stripe integration exists beyond the schema tables — checkout, webhooks, and metering are absent.
- Parent dashboard shows static placeholders: pricing `$11.50/mo` and the Mr Know-it-all quota are hardcoded, and Edit / sensitive-action buttons are toast stubs.
- 12 avatars are designed (ids 0–11) but the API reserves 0–19; the launcher falls back to Fox for unknown ids.
- Decision-log notes the auth-client cache flag "to be renamed `allowStaleFallback`" as pending; the rename has actually shipped and the old name is gone.

### Last touched

2026-05-26
