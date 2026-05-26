# @rumpusroom/auth-client

A small, dependency-free TypeScript library every RumpusRoom kid PWA imports to
check session and entitlement state against the RumpusRoom API. Framework-
agnostic, shippable as ESM, CommonJS, and IIFE.

## Install

```bash
npm install @rumpusroom/auth-client
```

Or load the IIFE bundle directly (exposes `window.RumpusRoom`):

```html
<script src="https://cdn.rumpusroom.app/auth-client/v1/index.global.js"></script>
```

## Quick start

```ts
import { RumpusClient } from "@rumpusroom/auth-client";

const rumpus = new RumpusClient({ appSlug: "kaleidoscope-camera" });

// On app boot:
const session = await rumpus.getSession();

if (!session.authenticated) {
  rumpus.redirectToLauncher("unauthenticated");
} else if (!rumpus.isAppUnlocked()) {
  rumpus.redirectToLauncher("locked");
} else if (session.mode !== "kid") {
  // Opened in parent mode — usually a parent previewing. Default: allow.
}

// Handle expiry surfaced by a later fetch (e.g. the subscription lapsed or a
// parent signed out on another device, picked up on the next getSession/refresh):
rumpus.on("session-expired", () => {
  saveAppState();
  rumpus.redirectToLauncher("expired");
});
```

The library never auto-redirects. It gives you the information and the helper;
your PWA decides the policy and renders its own loading / locked / signed-out
states.

## Configuration

```ts
new RumpusClient({
  appSlug: "kaleidoscope-camera", // required
  apiBase: "https://api.rumpusroom.app", // default
  cacheTTLSeconds: 60, // default
  allowStaleFallback: true, // default
});
```

## API

| Method | Description |
| --- | --- |
| `getSession(): Promise<MeResponse>` | Fetch `/me`, honoring the TTL cache. Within the TTL, returns cache with no network call; past it, fetches fresh. On a failed fetch, returns the cached response marked `stale: true` (if `allowStaleFallback`), otherwise rejects. |
| `refresh(): Promise<MeResponse>` | Like `getSession()` but always hits the network. Use after an action that may have changed entitlements (e.g. the user says they just paid). |
| `isAppUnlocked(): boolean` | Synchronous. True if this PWA's `appSlug` is in the last known `entitlements.apps_unlocked`. False before any fetch, when unauthenticated, or when not unlocked. Never throws. |
| `currentProfile(): KidProfile \| null` | The active kid profile in kid mode; `null` in parent mode or when unauthenticated. |
| `redirectToLauncher(reason?)` | Navigate to `https://rumpusroom.app/?from={appSlug}&reason={reason}`. `reason` is `'locked' \| 'unauthenticated' \| 'expired'`. |
| `on(event, handler): () => void` | Subscribe to an event; returns an unsubscribe function. |
| `signOut(): Promise<void>` | `POST /auth/signout`, clear the local cache, fire `session-changed`. |

### Cache behavior

`getSession()` follows a TTL cache:

- **Within `cacheTTLSeconds`** (default 60), it returns the cached response with
  no network call.
- **Past the TTL**, it blocks on a fresh `/me` fetch and resolves with that. The
  cache is used only as a fallback if the fetch fails: with `allowStaleFallback`
  (default `true`) it returns the cached response marked `stale: true`, otherwise
  it rejects.

So the lock/entitlement decision on boot reflects current server state once the
TTL has lapsed (a cancelled subscription or disabled app locks this session, not
the next one), while staying resilient to a flaky network. `refresh()` ignores
the TTL and always fetches — call it at sensitive moments (e.g. right after the
user says they just paid).

Synchronous getters (`isAppUnlocked`, `currentProfile`) are hydrated from any
persisted cache at construction, so a returning user gets an immediate answer
before the first `getSession()` resolves.

This client is poll-on-demand, not live: it only learns of a change when you
call `getSession()` (past the TTL) or `refresh()`. A subscription change made
elsewhere — e.g. on another device — surfaces on the next such call, not the
instant it happens. Reacting to changes within a single session is the
consumer's job (call `refresh()` and check). Cross-device push is out of scope
for v1.

### Events

| Event | Fires when |
| --- | --- |
| `session-changed` | Any field in `/me` differs from the previous response (and on `signOut`). |
| `session-expired` | A fetch returns unauthenticated when the previous response was authenticated. |
| `entitlement-changed` | `apps_unlocked` differs between two fetches. |

```ts
const off = rumpus.on("entitlement-changed", (res) => {
  if (!rumpus.isAppUnlocked()) rumpus.redirectToLauncher("locked");
});
// later: off();
```

## Storage

State is cached in `localStorage` under `rumpus.session.v1` as
`{ response, fetchedAt }`. All access is wrapped in try/catch — in private-
browsing modes and some embedded contexts `localStorage` throws, in which case
the client falls back to an in-memory cache silently.

## Build outputs

`npm run build` produces, in `dist/`:

- `index.mjs` — ESM
- `index.cjs` — CommonJS
- `index.global.js` — IIFE (`window.RumpusRoom = { RumpusClient }`)
- `index.d.ts` — TypeScript declarations

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Build all `dist/` outputs |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |

## Scope

This library is logic only. It does **not** render UI, request magic links
(sign-in happens on rumpusroom.app), switch profiles, report usage, or retry
failed requests. Those live elsewhere.
