# RumpusRoom Launcher — build brief

You're building the RumpusRoom launcher PWA: the authenticated app users
land in after signing in. It hosts profile selection, the kid-facing app
grid, and the parent dashboard. It is deployed to `rumpusroom.app` (the
authenticated product surface) and serves as the redirect target for kid
PWAs when they need to send users back.

This brief covers v0 — a functional skeleton with placeholder visuals.
A separate design pass will style it later.

## Stack

- Vite + React 18 + TypeScript
- React Router 6 for routing
- Tailwind CSS for styling (utility-first, no design system yet)
- `vite-plugin-pwa` for manifest + service worker
- Vitest + React Testing Library for tests
- `@rumpusroom/auth-client` for session and entitlement state (local file
  dep for now; install from `../auth-client` via `file:` protocol in
  `package.json` until distribution is sorted)

No additional UI libraries. No animation libraries. No state management
library — React state and context are sufficient at this scope.

## Repo layout to create
launcher/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── public/
│   ├── icons/                # PWA icons, placeholder geometric SVGs
│   └── avatars/              # Kid avatar SVGs, placeholder geometric
├── src/
│   ├── main.tsx              # React entry
│   ├── App.tsx               # Router + auth provider
│   ├── auth/
│   │   ├── AuthProvider.tsx  # Wraps auth-client, exposes session via context
│   │   └── useSession.ts     # Hook to consume the context
│   ├── routes/
│   │   ├── SignIn.tsx        # Email entry, magic link sent state
│   │   ├── ProfilePicker.tsx # "Who's playing?" — visible in parent mode
│   │   ├── AppGrid.tsx       # Kid-mode app tiles
│   │   ├── ParentDashboard.tsx # Subscription status, profile list, sign out
│   │   ├── Locked.tsx        # Shown when redirected from a locked app
│   │   └── Loading.tsx       # Initial load state
│   ├── components/
│   │   ├── AppTile.tsx       # One tile in the app grid
│   │   ├── ProfileTile.tsx   # One tile in the profile picker
│   │   ├── AvatarImage.tsx   # Renders avatar by ID
│   │   └── Layout.tsx        # Page shell, header, etc.
│   ├── lib/
│   │   ├── apps.ts           # App catalogue (slug, name, icon, launch URL)
│   │   ├── avatars.ts        # Avatar ID → SVG mapping
│   │   └── api.ts            # Thin wrapper for API calls beyond auth-client
│   └── styles.css            # Tailwind directives + global resets
├── test/
│   ├── auth.test.tsx
│   ├── routing.test.tsx
│   └── components.test.tsx
└── README.md

## Routing

Use React Router. Routes:

- `/` — root. Determines view based on session state (see routing logic below).
- `/signin` — sign-in form (email entry).
- `/signin/sent` — "check your email" confirmation.
- `/profiles` — profile picker. Parent mode only.
- `/apps` — kid-mode app grid. Kid mode only.
- `/dashboard` — parent dashboard. Parent mode only.
- `/locked` — landing for redirects from kid PWAs (`?from=slug&reason=locked`).

### Routing logic on `/`

On mount:
1. Show `Loading` view.
2. Call `rumpus.getSession()`.
3. If unauthenticated → redirect to `/signin`.
   - Honour `?from=` and `?reason=` query params — pass to `/signin` for messaging.
4. If parent mode → redirect to `/profiles`.
5. If kid mode → redirect to `/apps`.

### Routing logic on kid PWA redirect

When a kid PWA redirects to `https://rumpusroom.app/?from=slug&reason=locked|expired|unauthenticated`:
- Show appropriate message at the top of the sign-in or profile picker view.
- Don't auto-redirect anywhere — let the user see context for why they're back.

## Auth provider

`AuthProvider` wraps the app and:
- Instantiates a single `RumpusClient` with `appSlug: 'launcher'`.
- Calls `getSession()` on mount, stores result in React state.
- Subscribes to `session-changed`, `session-expired`, `entitlement-changed` events; updates state.
- Exposes `{ session, refresh, signOut, requestMagicLink, selectProfile }` via context.
- `requestMagicLink(email)` calls the API directly (auth-client doesn't do magic link request — that's launcher's job).
- `selectProfile(profileId)` calls `POST /profiles/:id/select` and refreshes session.

The auth-client semantics:
- The launcher does NOT call `isAppUnlocked()` — the launcher works for any
  authenticated user regardless of entitlement state. Entitlement state
  drives which apps appear in the grid, but doesn't gate launcher access.

## Sign-in flow

`SignIn.tsx`:
- Email input, "Send magic link" button.
- On submit: POST `/auth/magic-link`, navigate to `/signin/sent`.
- Show inline error if 429 (rate limited) or 4xx.
- If `?reason=unauthenticated` in URL, show "Please sign in to continue."
- If `?reason=expired` in URL, show "Your session expired. Sign in again."
- If `?reason=locked` in URL, show "This app needs a subscription. Sign in to manage your account."

`SignIn/Sent`:
- "Check your email for a sign-in link." Static confirmation page.
- Link to "use a different email" returning to `/signin`.

## Profile picker

`ProfilePicker.tsx`:
- Shown when session is parent mode.
- Heading: "Who's playing?"
- Grid of profile tiles (one per profile in `session.profiles`), sorted by `created_at` (already done by the API).
- One additional tile: "Parent dashboard" (navigates to `/dashboard`).
- Each profile tile: avatar + display name. Tap calls `selectProfile(id)`, which refreshes the session into kid mode, which routes to `/apps`.
- If no profiles exist, show empty state: "Add a kid profile to get started" with a link to the dashboard (where they can be created — but the dashboard's create flow is also TBD; for v0 you can leave a "Create profile" button that just calls `POST /profiles` with a hardcoded name and the next unused avatar, sufficient for testing).

## App grid (kid mode)

`AppGrid.tsx`:
- Shown when session is kid mode.
- Heading: profile's display name + avatar, "Hi, {name}!"
- Grid of app tiles, one per app in `session.entitlements.apps_unlocked`.
- Each tile: app icon (placeholder geometric SVG), app name. Tap navigates to the app's launch URL (defined in `src/lib/apps.ts`).
- App catalogue lives in `src/lib/apps.ts` as a static array:
```ts
  export const APPS = [
    { slug: 'mr-know-it-all', name: 'Mr Know-it-all', launchUrl: 'https://mrknow.rumpusroom.app/' },
    { slug: 'kaleidoscope-camera', name: 'Kaleidoscope', launchUrl: 'https://kaleidoscope.rumpusroom.app/' },
    // ... others, even if not yet deployed; use placeholder URLs
  ];
```
- "Switch profile" button in a corner, navigates to `/profiles`. But: switching profiles requires parent mode, and the kid is currently in kid mode. So this button actually navigates to `/profiles` which detects kid mode and... hmm. For v0, the "switch profile" button signs the kid out of kid mode by calling a yet-to-build endpoint, OR just shows a "Ask a grown-up to switch" message. **Decision needed**: implement the simpler path — switch button shows a modal "Ask a grown-up" that requires the parent to confirm. For v0, the modal just has a "Continue as parent" button that calls a new API endpoint `POST /profiles/deselect` (build this — it sets `active_profile = NULL` on the session and returns the session to parent mode, no elevation needed).

> **Note to Claude Code**: the `/profiles/deselect` endpoint isn't in the
> API yet. Add it to the API project in this session. It's a small addition:
> requires kid-mode session, sets `active_profile = NULL`, updates KV, returns
> the new session state. Do this *before* building the AppGrid switch button.

## Parent dashboard

`ParentDashboard.tsx`:
- Subscription status: plan, status, current_period_end (formatted as human date).
  - If `status === 'none'`, show "You don't have an active subscription" + a placeholder "Subscribe" button that does nothing for v0 (Stripe is next session).
- Profile list: each profile with display_name + avatar. No edit / delete UI in v0.
- "Add a profile" button: opens a simple form (display name input, avatar picker showing 8 placeholder avatars). On submit, calls `POST /profiles`. Refresh session.
- "Sign out" button: calls `signOut()`, navigates to `/signin`.
- Footer placeholder: "Manage billing" and "Manage account" buttons that show "Coming soon" toasts.

## PWA configuration

In `vite.config.ts`, configure `vite-plugin-pwa`:
- Manifest: name "RumpusRoom", short_name "RumpusRoom", theme_color and background_color as Tailwind defaults (slate-50 / indigo-500 placeholders — to be changed by design pass).
- Display: standalone.
- Icons: 192x192 and 512x512 placeholder SVGs in `public/icons/`.
- Service worker strategy: `generateSW`, `registerType: 'autoUpdate'`.
- Runtime caching: network-first for `/me`, cache-first for static assets.

## Placeholder visuals

For v0:
- Avatars: 20 SVG files in `public/avatars/`, each a coloured circle with a simple geometric shape (square, triangle, star, etc.). Map `avatar_id` 0-19 to these.
- App icons: one SVG per app in `public/icons/apps/`, each a coloured rounded square with the app's first letter. Lookup by slug.
- Logo: simple wordmark "RumpusRoom" in a friendly system font. No graphical logo yet.
- Colours: neutral Tailwind defaults (slate/indigo). Don't invest in a palette — that's the design pass.

## API base URL

Configurable via `VITE_API_BASE` env var; defaults to `http://localhost:8787`
in dev and `https://api.rumpusroom.app` in production builds. The auth-client
takes this in its constructor.

## CORS / cookie behaviour

The launcher will run on `http://localhost:5173` in dev, with the API on
`http://localhost:8787`. For cross-origin cookies to work in dev:

- The API must set `Access-Control-Allow-Credentials: true` and
  `Access-Control-Allow-Origin: http://localhost:5173` (NOT `*`).
- All fetches from the launcher must use `credentials: 'include'` (auth-client already does this).
- In production, the launcher and API are subdomains of `rumpusroom.app`, so the cookie is set with `Domain=.rumpusroom.app` and is sent on all requests; CORS isn't a same-site issue.

> **Note to Claude Code**: verify the API's CORS configuration supports this.
> If it doesn't, add CORS handling to the API in this session. Allowed origins
> in dev: `http://localhost:5173`. In production: `https://rumpusroom.app`.

## Tests

Cover at least:
- AuthProvider renders Loading on mount, then resolves to appropriate view based on mock session.
- SignIn submits email, calls API, navigates to `/signin/sent` on success.
- SignIn shows rate-limit message on 429.
- ProfilePicker renders all profiles from session.
- ProfilePicker's profile tap calls selectProfile and routes to /apps.
- AppGrid renders only entitled apps.
- AppGrid switch-profile button calls deselect and routes to /profiles.
- ParentDashboard's "Add profile" form submits and refreshes session.
- ParentDashboard's sign-out clears session.

Mock `RumpusClient` and `fetch`. No real network calls in tests.

## What NOT to build

- No Stripe checkout. Subscription state is read-only in v0.
- No profile deletion. Sensitive endpoint, deferred.
- No co-parent invite UI. Deferred.
- No data export / account delete UI. Deferred.
- No "manage billing" or "manage account" beyond placeholder buttons.
- No real-time updates / live entitlement push. Cache TTL handles it.
- No analytics / error tracking integration. Add after launch.
- No designed visuals. Placeholders only — explicit instruction.

## Definition of done

- `npm run dev` runs the launcher locally with hot reload.
- `npm run build` produces a production bundle.
- The launcher loads in a browser, and (with the API running locally):
  - Unauthenticated → sign-in form.
  - Submit email → see link in API console → click link → land in launcher, see profile picker.
  - Add a profile → see it in the picker.
  - Tap a profile → land in app grid showing entitled apps (note: in v0, subscription state is `none` by default, so apps_unlocked may be empty. Manually update a `subscriptions` row in D1 to `status='trialing'` to populate the grid for testing).
  - Tap an app tile → navigate to that app's launch URL (which will 404 for now; that's fine).
  - Switch profile button → back to picker.
  - Sign out → back to sign-in form.
- All tests pass.
- Manifest is valid; "Install" prompt appears in Chrome dev tools.

## Questions

If anything in this brief is ambiguous, ask before building. In particular,
flag any decision that affects the API contract — the API exists already
and we want to minimise rework there. The two API additions called out
above (`POST /profiles/deselect` and CORS configuration) should be the
only API changes needed.