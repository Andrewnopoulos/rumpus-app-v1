# RumpusRoom Launcher

The authenticated launcher PWA at `rumpusroom.app`: profile picker, kid-facing
app grid, and parent dashboard. It's the surface users land in after signing
in, and the redirect target kid PWAs send users back to.

Built per `docs/THIRD_BUILD_BRIEF.md`; styled per the locked design pass in the
repo-root `README.md` (the design handoff). The `prototype/` directory holds the
design reference this was recreated from.

## Stack

- Vite + React 18 + TypeScript
- React Router 6
- Tailwind CSS (tokens wired to the design's oklch CSS variables — see below)
- `vite-plugin-pwa` (manifest + service worker)
- `@rumpusroom/auth-client` for session/entitlement state (`file:../auth-client`)
- Vitest + React Testing Library

## Running locally

The launcher talks to the API (`../api`). In dev it **proxies** the API onto its
own origin (see "Dev wiring" below), so you run both:

```bash
# Terminal 1 — API on :8787
cd ../api
cp .dev.vars.example .dev.vars   # first time (already set up in this repo)
npm run migrate:local            # apply migrations to local D1
npm run dev

# Terminal 2 — launcher on :5173
cd ../launcher
npm install                      # first time
npm run dev
```

Open http://localhost:5173. End-to-end sign-in:

1. Enter a parent email → "Send sign-in link".
2. The magic link is printed to the **API (wrangler) console**. Open it.
3. It lands you back in the launcher at the profile picker.
4. Add a profile, tap it to enter the kid app grid, "Not Emma?" → back to picker.
5. Sign out from the picker or dashboard.

> The app grid is empty until the family has a `trialing`/`active` subscription.
> For testing, insert a row in local D1:
> ```bash
> cd ../api && npx wrangler d1 execute rumpusroom --local --command \
>   "INSERT INTO subscriptions (id, family_id, stripe_customer_id, status, plan, created_at, updated_at) \
>    VALUES ('s1','<FAMILY_ID>','c1','trialing','monthly',unixepoch(),unixepoch());"
> ```

## Dev wiring (why the proxy)

The API uses a single `APP_BASE_URL` for both the magic-link URL and the
post-consume redirect. Pointing it at the API would land the user on the API
after sign-in; pointing it at the launcher would send the consume link to a
route the launcher doesn't serve. The fix that needs **no API change**: run
everything on one origin in dev.

- `vite.config.ts` proxies `/auth`, `/me`, `/profiles`, `/health` → `:8787`.
- The auth client uses an **empty** `apiBase` (same origin) in dev.
- The API's `.dev.vars` sets `APP_BASE_URL=http://localhost:5173`.

So the magic-link link, consume redirect, cookie, and all API calls stay on
`localhost:5173`. No CORS needed in dev.

**Production** is genuinely cross-origin (`rumpusroom.app` ↔ `api.rumpusroom.app`),
so the API ships proper CORS (credentialed, origin-reflected). Set
`VITE_API_BASE=https://api.rumpusroom.app` for production builds. The API now
uses two env vars for the sign-in round trip: `API_BASE_URL`
(`https://api.rumpusroom.app`, where the magic-link consume link resolves) and
`LAUNCHER_BASE_URL` (`https://rumpusroom.app`, the post-consume redirect target).
In dev both point at the launcher origin so the proxy keeps everything on one origin.

## Styling

The design is locked and high-fidelity. Its tokens and component styles
(`prototype/launcher/theme.css`) are ported verbatim into `src/styles.css` as
CSS variables + component classes. Tailwind is configured (`tailwind.config.ts`
maps the oklch variables to colour utilities) and available, but the locked
component look lives in the design's own classes so fidelity is exact and
palette switching stays a one-attribute swap.

Palette: `<html data-palette="clay">` (default). The four palettes (Clay / Sea /
Sage / Sunday) override the same variables; change `DEFAULT_PALETTE` in
`src/App.tsx` to switch. Dark mode (`data-dark="true"`) is defined for parent
screens but not toggled in v0.

## Structure

```
src/
  main.tsx              React entry + service-worker registration
  App.tsx               Router, route guards, root resolver, palette
  styles.css            Tailwind directives + design tokens/components
  auth/
    AuthProvider.tsx    Wraps RumpusClient; session state + actions via context
    useSession.ts       Hook to consume the context
  routes/               SignIn, SignInSent, ProfilePicker, AppGrid,
                        ParentDashboard, Locked, Loading
  components/           icons, Wordmark, Banner, ToastProvider, modals
  lib/
    avatars.tsx         12 animal avatar SVGs + Avatar component
    apps.tsx            App catalogue (slug, name, icon, launch URL)
    api.ts              Thin wrapper for API calls beyond auth-client
test/                   auth / routing / components specs (RTL + mocked context)
```

## Routing

| Path | View | Notes |
| --- | --- | --- |
| `/` | resolver | → `/signin`, `/profiles`, or `/apps` by session; preserves `?from`/`?reason` |
| `/signin` | SignIn | email entry; `?reason` shows a banner |
| `/signin/sent` | SignInSent | "check your email" |
| `/profiles` | ProfilePicker | parent mode only |
| `/apps` | AppGrid | kid mode only |
| `/dashboard` | ParentDashboard | parent mode only |
| `/locked` | Locked | standalone redirect-back screen |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 (proxies the API) |
| `npm run build` | Typecheck + production build (+ PWA assets) |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |

## Scope (v0)

Per the brief: no Stripe checkout (subscription is read-only), no profile
deletion, no co-parent invite UI, no data export/account delete, no live
entitlement push. Placeholder visuals only where the design left them
(pricing `$11.50/mo`, the Mr Know-it-all quota) — see "Open / undecided" in the
design handoff.
