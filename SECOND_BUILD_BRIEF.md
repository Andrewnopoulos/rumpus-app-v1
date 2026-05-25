# RumpusRoom Auth Client — build brief

You're building `@rumpusroom/auth-client`, a small TypeScript library that
every RumpusRoom kid PWA imports to check session and entitlement state
against the RumpusRoom API.

This is a standalone library project. Its consumers are the kid PWAs
(currently six, each a separate repo). The library should be framework-
agnostic, dependency-free, and shippable as both ESM and IIFE bundles.

## Stack

- TypeScript, target ES2020
- tsup or unbuild for building both ESM and IIFE outputs (pick whichever
  is simpler — no strong preference)
- Vitest for tests
- No runtime dependencies. Zero.

## Repo layout to create
auth-client/
├── package.json
├── tsconfig.json
├── tsup.config.ts            (or unbuild equivalent)
├── README.md
├── src/
│   ├── index.ts              # Public API exports
│   ├── client.ts             # RumpusClient class
│   ├── types.ts              # Shared types (MeResponse, etc.)
│   ├── storage.ts            # localStorage wrapper with safe-fail
│   └── events.ts             # Tiny event emitter (no dependency)
├── test/
│   ├── client.test.ts
│   ├── storage.test.ts
│   └── events.test.ts
└── examples/
├── vanilla.html          # IIFE usage example
└── module.ts             # ESM usage example

## Public API

The library exports one class `RumpusClient` and a set of types. The class
constructor takes optional config:

```ts
new RumpusClient({
  apiBase?: string,           // default 'https://api.rumpusroom.app'
  appSlug: string,            // required, e.g. 'kaleidoscope-camera'
  cacheTTLSeconds?: number,   // default 60
  staleWhileRevalidate?: boolean, // default true
})
```

`appSlug` is required and used both for entitlement checks and for the
"this app is locked" redirect path back to the launcher.

### Methods

```ts
client.getSession(): Promise<MeResponse>
```
Fetches `/me` from the API. Returns the parsed response. Caches in
localStorage with the configured TTL. If the request fails and a cached
response exists, returns the cached response with `stale: true` added.

```ts
client.refresh(): Promise<MeResponse>
```
Same as `getSession()` but ignores cache. Use this after an action that
might have changed entitlements (e.g. the user reported they just paid).

```ts
client.isAppUnlocked(): boolean
```
Synchronous. Returns true if the most recently fetched session shows this
PWA's `appSlug` in `entitlements.apps_unlocked`. Returns false if no session
has been fetched yet, or if the response is unauthenticated, or if the
slug isn't unlocked. Never throws.

```ts
client.currentProfile(): { id: string, display_name: string, avatar_id: number } | null
```
Returns the active kid profile if in kid mode, null otherwise. Null also
when in parent mode or unauthenticated.

```ts
client.redirectToLauncher(reason?: 'locked' | 'unauthenticated' | 'expired'): void
```
Navigates to `https://rumpusroom.app/?from={appSlug}&reason={reason}`.
The launcher uses these query params to show appropriate messaging
("This app is locked, upgrade to access" vs "Sign in to continue").

```ts
client.on(event: 'session-changed' | 'session-expired' | 'entitlement-changed',
         handler: (response: MeResponse) => void): () => void
```
Subscribe to events. Returns an unsubscribe function. Events fire when:
- `session-changed`: any field in `/me` differs from the previous response
- `session-expired`: a fetch returns unauthenticated when the cache showed authenticated
- `entitlement-changed`: `apps_unlocked` differs from the previous response

```ts
client.signOut(): Promise<void>
```
Calls `POST /auth/signout` on the API, clears the local cache, fires
`session-changed`, and resolves.

## MeResponse type

Mirror the shape the API returns. Define discriminated union:

```ts
type MeResponse =
  | { authenticated: false; stale?: boolean }
  | {
      authenticated: true;
      mode: 'parent';
      elevated: boolean;
      parent: { id: string; email: string; display_name: string | null };
      family: { id: string; display_name: string | null };
      co_parents: Array<{ id: string; email: string; display_name: string | null }>;
      profiles: Array<{ id: string; display_name: string; avatar_id: number }>;
      subscription: {
        status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'unpaid' | 'none';
        plan: 'monthly' | 'annual' | null;
        current_period_end: number | null;
      };
      entitlements: { apps_unlocked: string[] };
      stale?: boolean;
    }
  | {
      authenticated: true;
      mode: 'kid';
      profile: { id: string; display_name: string; avatar_id: number };
      family_id: string;
      entitlements: { apps_unlocked: string[] };
      stale?: boolean;
    };
```

## Fetch behaviour

All API calls go to `${apiBase}/me`, `${apiBase}/auth/signout`, etc.
Always include `credentials: 'include'` so the cross-subdomain session
cookie is sent. Set `Accept: 'application/json'`.

On network failure or non-2xx response (except 401, which is treated as
"unauthenticated"), and a cached response exists, return the cached
response with `stale: true`. Log a warning to console once, not repeatedly.

On 401 from `/me`, treat as `{ authenticated: false }`, clear cached
authenticated response, fire `session-expired` if previously authenticated.

Do not retry. Failures bubble up to the consumer (with cache fallback
as described).

## localStorage shape

Key: `rumpus.session.v1` (versioned so future migrations are easy).
Value: JSON-encoded `{ response: MeResponse, fetchedAt: number }` where
`fetchedAt` is `Date.now() / 1000`.

All localStorage access wrapped in try/catch — in private browsing modes
and some embedded contexts, localStorage throws on access. Fail silently
to in-memory cache only.

## Initialisation pattern in a consuming PWA

The README should show the recommended pattern:

```ts
import { RumpusClient } from '@rumpusroom/auth-client';

const rumpus = new RumpusClient({ appSlug: 'kaleidoscope-camera' });

// On app boot:
const session = await rumpus.getSession();

if (!session.authenticated) {
  rumpus.redirectToLauncher('unauthenticated');
} else if (!rumpus.isAppUnlocked()) {
  rumpus.redirectToLauncher('locked');
} else if (session.mode !== 'kid') {
  // App is being opened in parent mode — usually means the parent is
  // previewing. Up to the PWA whether to allow this. Default: allow.
}

// Listen for live changes (e.g. parent cancels mid-session in another tab):
rumpus.on('session-expired', () => {
  // Save app state, then redirect.
  saveAppState();
  rumpus.redirectToLauncher('expired');
});
```

The library does not auto-redirect on init — that's the consumer's
decision. The library provides the information and the helper; the PWA
decides the policy.

## Tests

Cover at least:
- `getSession` returns parsed response on 200
- `getSession` returns cached response with `stale: true` on network error
- `getSession` returns `{ authenticated: false }` on 401 and clears cache
- `isAppUnlocked` returns true when slug is in `apps_unlocked`
- `isAppUnlocked` returns false when slug is absent, response is
  unauthenticated, or no fetch has happened
- `currentProfile` returns the profile in kid mode, null in parent mode,
  null when unauthenticated
- Event firing: `session-expired` fires on 401 after a prior authenticated
  response
- Event firing: `entitlement-changed` fires when `apps_unlocked` changes
  between fetches
- `signOut` clears cache and fires `session-changed`
- Storage failure (localStorage throws) does not crash the client; falls
  back to in-memory

Mock `fetch` globally in tests. Use `@vitest/spy` or similar. No need
for a real test server.

## Build outputs

Build to `dist/`:
- `dist/index.mjs` — ESM build, for `import { RumpusClient } from '@rumpusroom/auth-client'`
- `dist/index.cjs` — CommonJS (in case any old PWA needs it)
- `dist/index.global.js` — IIFE build, exposes `window.RumpusRoom = { RumpusClient }`
- `dist/index.d.ts` — TypeScript declarations

The IIFE build's `examples/vanilla.html` should demonstrate:
```html
<script src="https://cdn.rumpusroom.app/auth-client/v1/index.global.js"></script>
<script>
  const rumpus = new RumpusRoom.RumpusClient({ appSlug: 'kaleidoscope-camera' });
  rumpus.getSession().then(session => { /* ... */ });
</script>
```

(The actual CDN deployment isn't part of this brief — just structure the
build so it would work.)

## What NOT to build

- No UI components. The library is logic only; each PWA renders its own
  "locked" / "loading" / "signed out" states.
- No magic-link request flow. Sign-in happens on rumpusroom.app, not in
  kid PWAs.
- No profile-switching UI. That's the launcher's job.
- No usage reporting (e.g. for Mr Know-it-all metering). That's a separate
  endpoint and will live in a different module or be added to this client
  later.
- No retry logic, no exponential backoff, no offline queue. Keep it simple.

## Definition of done

- `npm run build` produces all four `dist/` outputs cleanly.
- All listed tests pass.
- `examples/vanilla.html` opens in a browser and (with the API running
  locally and a session cookie set) logs the session state to console.
- README documents the public API with the example pattern above.
- No runtime dependencies in `package.json`.

## Questions

If anything is ambiguous, ask before building. If you think the design
is wrong, flag it before changing — particularly around the cache
semantics and event model.