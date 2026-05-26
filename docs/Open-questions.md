# RumpusRoom Open Questions

Things deferred. Prune as questions resolve and move resolutions to
decisions.md.

## Blocking schema or Stripe setup
- Final monthly and annual price points (AUD). Range probably $8-15/mo;
  need parent conversations to narrow.
- Mr Know-it-all quota unit and ceiling. Voice turns per day? Per month?
  Need to model ElevenLabs + Claude API cost per turn against target
  margin before locking the quota.
- Does the dinner planner ship in v1, or stay separate? It targets the
  parent, not the kid, which is a different value prop.

## Important but parallelisable
- Will we work with a freelance designer/illustrator, or do brand and
  illustration in-house? Decide before brand.md is written.
- Which kid PWA gets the pilot auth-client integration? Probably
  whichever is simplest to retrofit; need to skim each repo.
- Email infrastructure: Resend vs Postmark. Both work with Workers;
  small differences in pricing and DX.
- Session lifetimes: long-lived "device trusted" session + short-lived
  "sensitive actions" session — desired in principle; exact TTLs TBD.

## Pre-launch operational
- Support inbox setup (support@rumpusroom.app forwarding to founder).
- Lawyer for ToS + Privacy Policy review (Australian-qualified,
  consumer SaaS or kid-product experience preferred). Budget ~AUD
  $1,500-3,000.
- Analytics stack: Cloudflare Web Analytics + something product-level
  (PostHog?) + Sentry for errors. Confirm before launch.
- Status page approach if Cloudflare itself has an outage.
- Confirm domain layout: launcher at rumpusroom.app root vs
  app.rumpusroom.app subdomain. Affects DNS, marketing site location,
  cookie scope verification.

## Design / content (surfaced in the launcher build)
- Avatar set: 12 animals designed (ids 0–11); the API reserves 0–19. Either
  design 8 more or relax validation to 0–11. Launcher falls back to the Fox
  for unknown ids meanwhile, so it's not blocking.
- App display names: 4 of 6 are working titles (Flip Studio, Echo, Funny
  Face, Dinner Vote). Slugs are the contract; names need founder sign-off.
  Mr Know-it-all and Kaleidoscope are confirmed.

## Strategic / later
- When (not whether) to publicly open app requests from subscribers.
  Defer until ~50+ paying families so the form looks like a community
  not a void.
- Pricing for any future "RumpusRoom for parents" features
  (dinner planner, etc.) — bundled, separate, or upsell.
- Real-time entitlement push (SSE or long-polling) for sub-60s
  propagation of cancellation, refunds, etc. across devices. Add if
  evidence of need; not a v1 concern.
  