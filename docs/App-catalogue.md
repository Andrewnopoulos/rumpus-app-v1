# RumpusRoom Apps Catalogue

One entry per existing PWA. Keep updated as integration status changes.

All six apps now live under `rumpusroom/pwas/<name>` in this workspace (they
were previously standalone repos at `~/Documents/repos/<name>` — stale
references to that old path still appear in `knowitall2`'s docs and
`colliderscope`'s `.claude/settings.local.json`). None has been wired to the
RumpusRoom auth-client yet; every entry below reads "Auth-client integration:
Not started," confirmed by grep — the only `/me` calls in the tree belong to
Mr Know-it-all's own Cloudflare Access admin, not the shared auth-client.

Three of the apps (Talky Cat, Flipa, SnapRat) are the same Cloudflare PWA
template: **Vite + React 18 + TypeScript (strict) + Zustand + `idb` over
IndexedDB + `vite-plugin-pwa` + Sharp-generated icons**, deployed to
**Cloudflare Pages via Wrangler direct upload** (`npm run deploy`, CF
credentials loaded from `.env` by `dotenv-cli`). They store everything
client-side in IndexedDB — no backend, no accounts, no network calls. Per-app
entries below note only where each diverges from that baseline.

## Mr Know-it-all
- What it is: AI voice Q&A for kids. Kid speaks a question, app speaks
  back a kid-safe answer. ElevenLabs for voice, Claude API for answers.
- Repo: `rumpusroom/pwas/knowitall2` (package name `knowitall`)
- Stack: Cloudflare Worker (Hono) as the single backend; D1 (cache + events +
  corpus), R2 (audio + logs), KV (blocklist, devices, reports). Two front-ends
  served from the worker's `ASSETS` binding: a React+Vite admin SPA at
  `/admin/` and a vanilla-TS + Vite kid PWA at `/play/` (~6 kB JS). Claude
  (Haiku 4.5 for classifier/answer/realtime-moderator, Sonnet 4.6 for the
  every-2h background moderator) and ElevenLabs TTS both via Cloudflare AI
  Gateway; STT via Workers AI Whisper-v3-turbo.
- Current deploy: Production at `mrknowitall.org` / `www.mrknowitall.org`
  (Cloudflare-registered zone, worker custom domain). Staging at
  `knowitall-staging.y2hva2vvbml0.workers.dev`. Full parallel resource set per
  env (`-staging` / `-prod`), separate AI Gateway and Access app per env.
- Status: Functional and live in production. All six build phases plus polish
  are done. Of the three gaps the previous catalogue flagged: **content
  moderation is built** (classifier fails closed to "grown-up," realtime +
  background Sonnet rescan, pre-recorded grown-up/fallback MP3s, `/report`);
  **cost control is alerting only** — a daily cron emails if AI-Gateway spend
  exceeds $5, which is not the hard quota with no-overage billing the product
  decisions call for; **quota UI is not built** here and belongs on the
  launcher anyway. So: production-grade moderation done, hard cost ceiling and
  quota UI still open.
- Auth-client integration: Not started
- Notes: This is the flagship. Highest care, longest QA cycle. Auth today is
  Cloudflare Access (admin, two allow-listed emails) plus per-device HMAC
  request signing (kids) — entirely separate from the RumpusRoom session
  model, so the retrofit here is the largest of the six. Operational detail in
  `pwas/knowitall2/DEPLOYMENT.md` and `PROGRESS.md`; five background crons
  (cleanup, bg-moderation, corpus-promote, weekly-report, cost-alert).

## Snapchat-like filter app
- What it is: Selfie filters with kid-drawable custom filters. No
  social, no sharing, no accounts beyond RumpusRoom profile.
- Repo: `rumpusroom/pwas/snaprat`
- Stack: Shared React PWA template, plus `@mediapipe/tasks-vision`
  (FaceLandmarker, 478 landmarks, runs in-browser via WASM/WebGL) and
  `three.js`. Preset filters (dog/bunny/crown) are canvas-2D sprites anchored
  to landmarks; the kid-drawn custom filter is applied via a 3-point affine
  warp. Photo and 3–10s video+audio capture via MediaRecorder. Snaps and
  custom filters persist in IndexedDB.
- Current deploy: Cloudflare Pages project `snaprat`; `dist/` is built. Deploy
  script passes `--branch=main --commit-dirty=true`.
- Status: Substantially built and exceeds its own plan. `src/` has the full
  camera, filter strip, preset renderer, custom-filter editor + renderer,
  gallery, video recording and capture pipeline. Not yet verified end-to-end on
  a device here. Service worker is configured to cache the ~5 MB MediaPipe
  model (Workbox cap raised to 6 MB).
- Auth-client integration: Not started
- Notes: `PLAN.md` still says "Implementation pending (2026-05-19)" — stale;
  the code was built out through 2026-05-20 (three.js, face-skirt, custom
  filter renderer all present). Treat the code as ground truth over the plan.

## FlipaClip-like animation app
- What it is: Simple frame-by-frame animation. No ads, no in-app
  purchase, no account.
- Repo: `rumpusroom/pwas/flipa`
- Stack: Shared React PWA template, plus `gifenc` for client-side GIF export.
  Frame canvases, playback controls, frame strip, and a persistence layer over
  IndexedDB.
- Current deploy: Cloudflare Pages project `flipa`; `dist/` is built. Git
  history includes "first deployed version," so it has shipped at least once.
- Status: Functional. Drawing toolbar, canvas area, frame strip, playback
  controls and export are all present; recent commits are UI polish ("updated
  button sizes," "fixed viewport on phone").
- Auth-client integration: Not started

## Talking Tom-like app
- What it is: Cut-down Talking Tom clone. Kid speaks, character
  repeats. No ads, no IAP.
- Repo: `rumpusroom/pwas/chattycat` (package + CF Pages project name `talky-cat`)
- Stack: Shared React PWA template. A `voiceLoop` captures the mic and an
  `effects` module pitches it up; a `Cat` component animates while it plays
  back. No speech recognition — it re-pitches the recorded audio rather than
  transcribing and re-speaking.
- Current deploy: Cloudflare Pages project `talky-cat`; `dist/` is built.
- Status: Functional standalone. Record button, cat animation, effect
  switcher and IndexedDB persistence are present.
- Auth-client integration: Not started
- Notes: Directory is `chattycat` but everything else (package name, CF Pages
  project, manifest) is "Talky Cat" / `talky-cat` — name both when searching.
  It mimics voice in a "cartoon chipmunk pitch" rather than literally repeating
  speech, so it's Talking-Tom-*like* rather than a faithful clone. No `.git` in
  this directory.

## Kaleidoscope camera
- What it is: Kaleidoscope effect over device camera. Toy/creativity.
- Repo: `rumpusroom/pwas/colliderscope`
- Stack: Vanilla JS + WebGL, no framework and no build step. Custom GL
  renderer (`src/gl/`), kaleidoscope modes, an emoji particle/physics system,
  device-motion + swipe input, and canvas capture. PWA via a hand-written
  `manifest.webmanifest` and `sw.js`; SVG icon.
- Current deploy: Cloudflare Pages via manual `wrangler pages deploy` (static
  files copied to a temp dir and uploaded — there's no `package.json` or deploy
  script; the flow is visible in `.claude/settings.local.json`). CF creds in
  `.env`.
- Status: Functional. Three git commits ("initial commit," "first pass,"
  "tilted"); a `.gitignore` change is uncommitted.
- Auth-client integration: Not started
- Notes: Likely simplest retrofit candidate for auth-client pilot. Being a
  buildless static app on its own origin, the retrofit is just dropping in the
  IIFE build of the auth-client and a `/me` check.

## Dinner voting / planning app
- What it is: Kids vote on dinner from recipe images; parents plan
  weekly meals and generate shopping lists. Targets parent + kid.
- Repo: `rumpusroom/pwas/dinners`
- Stack: SvelteKit 2 + Svelte 5 + TypeScript, Tailwind v4, Drizzle ORM over
  Cloudflare D1, R2 for recipe/avatar photos, deployed via
  `@sveltejs/adapter-cloudflare` to Cloudflare Pages. Server-rendered with
  role-gated routes; service worker does cache-first photos, network-first HTML.
- Current deploy: Cloudflare Pages project `dinners`; D1 `dinners-db` (a real
  `database_id` is set in `wrangler.jsonc`, so the remote DB exists) and R2
  bucket `dinners-photos`. Built output in `.svelte-kit/cloudflare`.
- Status: Functional. Family picker, recipe browse + heart toggle, parent
  plan / shopping-list / admin routes, R2-streamed images, weekly-tally logic
  (Australia/Perth week boundary), Drizzle schema + migration + seed.
- Auth-client integration: Not started
- Notes: V1 inclusion undecided (see open-questions.md). Different value prop
  from the other apps — it targets parent + kid together, not a kid solo toy.
  Auth here is deliberately not real security: an HMAC-signed `family_user_id`
  cookie set by tapping a family member, parent routes gated on role. The
  threat model is "the 4-year-old taps wrong things," which will need rethinking
  against the RumpusRoom session model.
