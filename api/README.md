# RumpusRoom API

Cloudflare Worker (TypeScript) + D1 + KV. Foundational auth/session/profile
layer. No Stripe, no real email, no UI — those are separate sessions.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars        # local SESSION_SECRET
npm run migrate:local                 # apply migrations to local D1
npm run dev                           # wrangler dev on :8787
```

## Commands

| Script                  | Purpose                              |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Local Worker + local D1/KV           |
| `npm test`              | Vitest (workers pool, local D1)      |
| `npm run typecheck`     | `tsc --noEmit`                       |
| `npm run migrate:local` | Apply migrations to local D1         |
| `npm run migrate:remote`| Apply migrations to remote D1        |

## Manual smoke test

```bash
curl -s localhost:8787/health
# Request a magic link; the link is printed to the wrangler dev console:
curl -s -X POST localhost:8787/auth/magic-link \
  -H 'content-type: application/json' -d '{"email":"you@example.com"}'
# Paste the printed /auth/consume?token=... URL to get an rr_session cookie,
# then GET /me, POST /profiles, POST /profiles/:id/select.
```

## Endpoints

- `GET  /health`
- `GET  /me`
- `POST /auth/magic-link` — request a sign-in link
- `GET  /auth/consume?token=...` — magic-link OR elevation, by token purpose
- `POST /auth/elevate` — request an elevation link (parent mode)
- `POST /auth/signout`
- `POST /profiles`, `GET /profiles`, `POST /profiles/:id/select`

## Notes / deviations from the brief

- `display_order` was removed from the API contract (it had no schema column).
  Kid profiles are ordered by `created_at ASC` instead. (Confirmed with owner.)
- `SESSION_SECRET` (HMAC for the signed session cookie): `.dev.vars` locally,
  `wrangler secret put` in production.
- Cookie omits `Domain`/`Secure` on localhost so local dev works over http.
