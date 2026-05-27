# RumpusRoom production stand-up + Kaleidoscope pilot — build brief

You're taking RumpusRoom from "works on localhost" to "runs on real
subdomains," and using the simplest kid PWA — Kaleidoscope — to prove the one
architectural bet the whole product rests on: a parent signs in on the
launcher, opens a kid app on a *different* subdomain, and that app knows who
they are and whether they're entitled, via a shared cookie and a single `/me`
call.

Read this honestly: this is not a small retrofit. Nothing is deployed yet —
`api/wrangler.toml` still has `local-dev-placeholder` D1 and KV IDs, no route
bindings, and there is no Pages config for the launcher or colliderscope. The
launcher's "tested against the live API" means local `wrangler dev` behind a
same-origin Vite proxy, so credentialed *cross-origin* `/me` has never run
once. The Decision-log says so directly: the CORS bullet ends *"Exercised only
in production."* So this brief is the first production stand-up of three
subdomains, and Kaleidoscope is the third one, chosen because it's a buildless
static app and the retrofit is the smallest of the six.

Scope is deliberate. Stand up production, retrofit Kaleidoscope, prove the
cross-subdomain session. Do **not** wire real email, do **not** touch Stripe,
do **not** retrofit the other five apps, do **not** build a CI pipeline. Those
are later sessions.

## Prerequisites — confirm before writing any code

These are external blockers. If any is unmet, stop and tell me; some have a
real-world wait attached.

1. **Is the `rumpusroom.app` zone registered and on Cloudflare?** Everything
   below assumes the zone exists and nameservers point at Cloudflare. If it's
   not registered, that's step zero, and DNS/registration propagation can take
   hours. Confirm this first.
2. **Domain layout is launcher-at-root.** The committed env vars
   (`API_BASE_URL = https://api.rumpusroom.app`, `LAUNCHER_BASE_URL =
   https://rumpusroom.app`) and the auth-client's hardcoded
   `LAUNCHER_URL = "https://rumpusroom.app/"` already commit to the launcher at
   the apex and the API at `api.`. Don't second-guess it here; Open-questions
   flagged apex-vs-`app.` but the code has resolved to apex.
3. **Kaleidoscope's subdomain is `kaleidoscope.rumpusroom.app`.** That's the
   `launchUrl` in `launcher/src/lib/apps.tsx` for slug `kaleidoscope-camera`.
   The deploy target and the slug are both contracts — match them exactly.

## What's already correct (verify, don't rebuild)

- **The cookie model.** `api/src/lib/cookies.ts` sets
  `Domain=.rumpusroom.app; Path=/; HttpOnly; Secure; SameSite=Lax` in
  production. Subdomains of `rumpusroom.app` are same-site, so `SameSite=Lax`
  still sends the cookie on the kid app's `credentials: 'include'` fetch to
  `api.rumpusroom.app`. No change needed.
- **The auth-client prod defaults.** `auth-client/src/client.ts` defaults
  `apiBase` to `https://api.rumpusroom.app` and `LAUNCHER_URL` to
  `https://rumpusroom.app/`. A kid PWA using the IIFE build with no config
  points at production out of the box.
- **The launcher prod build.** `launcher/src/lib/api.ts` resolves the API base
  to `https://api.rumpusroom.app` for any non-dev build, and `AuthProvider`
  passes it to `RumpusClient`. A plain `npm run build` is production-correct.

## What is actually broken for cross-subdomain (the one code change)

`api/src/index.ts` allowlists exactly two CORS origins: `http://localhost:5173`
and `https://rumpusroom.app`. A kid PWA on `https://kaleidoscope.rumpusroom.app`
is a **different origin**, so its credentialed `/me` fetch will be
CORS-rejected. `Access-Control-Allow-Credentials: true` forbids a `*` origin,
so you can't wildcard it. Add kid-PWA subdomains to the allowlist:

- Either enumerate the six known launch-URL origins from `apps.tsx`, or
- Match any `https://<sub>.rumpusroom.app` origin by suffix and reflect it.

Prefer the suffix match — it covers all six future retrofits without another
API change, and it's still a closed set (only `.rumpusroom.app` subdomains,
never arbitrary origins). Keep `http://localhost:5173` for dev. Add a test in
the API suite that a `kaleidoscope.rumpusroom.app` Origin is reflected and a
random origin is not. This is the only source change to the API.

## Phase 1 — Stand up the API at api.rumpusroom.app

1. Create a real D1 database (`wrangler d1 create rumpusroom`) and a real KV
   namespace for sessions. Put the returned IDs into `api/wrangler.toml`,
   replacing both `local-dev-placeholder` values. These IDs are not secrets;
   committing them is fine.
2. Apply the migration to the remote DB:
   `wrangler d1 migrations apply rumpusroom --remote`. Confirm all tables from
   `0001_initial.sql` exist.
3. Set the session secret in production:
   `wrangler secret put SESSION_SECRET`. Do not commit it; `.dev.vars` stays
   local-only.
4. Add the custom domain / route so the worker serves `api.rumpusroom.app`
   (custom-domain binding in `wrangler.toml` or the dashboard), then deploy:
   `wrangler deploy`.
5. Smoke test: `GET https://api.rumpusroom.app/health` returns
   `{ status: "ok", time: ... }`.

**Signing in without email yet.** Email is still the console stub, on purpose.
In production the stub's `[EMAIL] ... Link: ...` line goes to the worker log —
read it with `wrangler tail` and paste the consume link into the browser
yourself. That's the bridge until a real provider is wired in a later session;
it's enough to exercise the full prod sign-in round trip now.

## Phase 2 — Deploy the launcher at rumpusroom.app

1. `npm run build` in `launcher/` (the `file:../auth-client` dep resolves
   against the already-built `auth-client/dist`; rebuild auth-client first if
   its dist is stale).
2. Deploy `launcher/dist` to a Cloudflare Pages project and bind the apex
   `rumpusroom.app` (`wrangler pages deploy dist --project-name rumpusroom`,
   then attach the custom domain). No `VITE_API_BASE` override is needed — the
   non-dev default is correct.
3. Smoke test the **first real cross-origin credentialed round trip**, which is
   the entire point of this phase:
   - Load `https://rumpusroom.app` → sign-in form.
   - Submit your email, read the consume link from `wrangler tail`, open it →
     land back in the launcher in parent mode (profile picker).
   - In browser devtools, confirm the `rr_session` cookie is set with
     `Domain=.rumpusroom.app` and `Secure`, and that `GET
     https://api.rumpusroom.app/me` from the launcher origin succeeds (this is
     the cross-origin credentialed call that has never run before).
   - Add a profile, select it → kid-mode app grid renders. With no
     subscription, `apps_unlocked` is empty, so the grid is empty — expected;
     Phase 3 sets up entitlement.

## Phase 3 — Retrofit Kaleidoscope and prove the architecture

Kaleidoscope is `pwas/colliderscope` (workspace root, not under `rumpus/`): a
buildless vanilla-JS + WebGL app with `index.html`, `manifest.webmanifest`,
`sw.js`, and `src/`. It already deploys via manual `wrangler pages deploy`
(there's a `.wrangler/` dir and `.env` with CF creds).

1. **Vendor the auth-client IIFE.** There's no CDN yet, and the app has no
   build step, so copy `auth-client/dist/index.global.js` into the app (e.g.
   `pwas/colliderscope/vendor/rumpus-auth.js`) and add a `<script>` for it in
   `index.html` *before* the app's own entry script.
2. **Add a boot gate** that runs before the app initialises. Use the
   recommended pattern from the auth-client README — defaults are
   production-correct, so the only config is the slug:
   ```js
   const rumpus = new RumpusRoom.RumpusClient({ appSlug: 'kaleidoscope-camera' });
   const session = await rumpus.getSession();
   if (!session.authenticated) {
     rumpus.redirectToLauncher('unauthenticated');
   } else if (!rumpus.isAppUnlocked()) {
     rumpus.redirectToLauncher('locked');
   } else {
     // boot the existing app
   }
   ```
   The slug **must** be `kaleidoscope-camera` exactly — `isAppUnlocked()`
   compares it against `apps_unlocked` from `/me`, and the API's `APP_SLUGS`
   (`api/src/routes/me.ts`) uses that string. Keep the change minimal: gate the
   existing entry point, don't restructure the app.
3. **Mind the service worker.** `sw.js` is cache-first for the app shell. Make
   sure a returning, now-signed-out user still hits the gate rather than a
   cached bypass — the `getSession()` call is a network fetch to a different
   origin and isn't in the SW's scope, so this should hold, but verify by
   testing the signed-out path on a second load.
4. **Deploy** to `kaleidoscope.rumpusroom.app` (`wrangler pages deploy` for the
   colliderscope project, then bind the custom subdomain).
5. **Deploy the API CORS change** from the section above before testing, or the
   `/me` fetch from the kid origin will be blocked.

### The three states that prove the pilot

Toggle entitlement with a single `family_app_overrides` row rather than faking
a Stripe subscription — `me.ts` adds `comped` slugs even when the base set is
empty, so no dummy `stripe_customer_id` is needed. Using the `family_id`
created when you signed in:

- **Unauthenticated:** open `https://kaleidoscope.rumpusroom.app` in a fresh
  session → redirected to `rumpusroom.app/?from=kaleidoscope-camera&reason=unauthenticated`.
- **Authenticated but locked:** signed in, no override row → redirected with
  `reason=locked`.
- **Entitled:** insert
  `family_app_overrides(family_id, 'kaleidoscope-camera', 'comped', ...)` via
  `wrangler d1 execute rumpusroom --remote` → reload → the app boots, the
  cookie carried the session cross-subdomain, and `/me` reported it unlocked.

That third bullet is the whole reason this session exists. When it works, the
subdomain architecture is proven and the remaining five retrofits get cheap.

## What NOT to build in this session

- **Real email.** Keep the console stub; read magic links from `wrangler tail`.
  Wiring Resend/Postmark is a later session.
- **Stripe, in any form.** No checkout, no webhooks. Use a `comped` override
  (or a hand-inserted `trialing` subscriptions row) to drive entitlement.
- **The other five retrofits.** Prove it on Kaleidoscope first.
- **CI/CD.** Manual `wrangler deploy` / `wrangler pages deploy` is fine for now.
- **Admin console, marketing site, designed avatars beyond what exists.**
- **Any launcher or auth-client feature work.** They're done for this purpose;
  the only source change is the API CORS allowlist.

## Definition of done

- `GET https://api.rumpusroom.app/health` returns ok against a real D1 + KV.
- Full prod sign-in works: magic link read from `wrangler tail`, consumed,
  `rr_session` cookie observed in devtools as `Domain=.rumpusroom.app; Secure`.
- The launcher at `rumpusroom.app` reaches the profile picker, and a
  cross-origin credentialed `GET api.rumpusroom.app/me` succeeds from it.
- `kaleidoscope.rumpusroom.app` gates correctly in all three states above,
  including the entitled state booting the real app.
- The API CORS allowlist accepts `*.rumpusroom.app` kid subdomains and rejects
  unknown origins, with a test covering it.
- STATUS.md is updated per META-STATUS.md once the pilot lands.

## Questions / risks to flag before starting

- **Zone registration** is the gating unknown (prerequisite 1). Everything
  stalls if `rumpusroom.app` isn't on Cloudflare yet.
- **Pages vs. Workers for the launcher.** This brief assumes Cloudflare Pages
  for the launcher and colliderscope (static output), Workers for the API. If
  you'd rather serve the launcher from a Worker's `ASSETS` binding like
  knowitall2 does, say so — it changes the deploy steps but not the auth logic.
- The avatar-id range debt (API allows 0–19, only 0–11 designed) is unrelated
  to this pilot; leave it.

If anything here is ambiguous, or you think a step is wrong, flag it before
acting — particularly anything that would change the API contract, since the
launcher and the five un-retrofitted apps depend on it.
