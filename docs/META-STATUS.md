# Draft STATUS.md for the RumpusRoom project

You're drafting a STATUS.md file that captures the current state of the
RumpusRoom project. This file gives future Claude instances (and me, when
I forget) a one-page snapshot of where things are.

## What STATUS.md is

A single-page current-state snapshot. NOT a chronological log. NOT a
changelog. The whole file is meant to be rewritten when it goes stale,
not appended to. Keep it tight — under 300 words ideally, under 500 max.

## Where to put it

In the root of the project's docs directory, alongside CLAUDE.md,
Decision-log.md, Open-questions.md, and App-catalogue.md. Confirm the
exact path by inspecting the existing docs layout before writing.

## Required sections

Use exactly these five headings, in this order:

### Current state
What's built and working end-to-end. One short paragraph per major
component (API, auth-client library, launcher PWA, marketing site,
admin console, kid PWAs). For each, say what's actually working, not
what's planned.

### In progress
What's partially done with work outstanding. Include what's blocking
each item. If nothing is actively in flight, say "Nothing in active
flight" — don't pad.

### Next up
The next concrete chunk of work. One or two items max. Enough context
that a new Claude reading this knows what the next session is about.

### Known issues / debts
Things that ship as working but aren't right yet. Misnamed flags,
deferred follow-ups, stubs that need real implementations, endpoints
that exist but return placeholder data. Be honest — this list is the
debt register, not a wish list.

### Last touched
Today's date in YYYY-MM-DD format.

## How to determine the actual state

Do not make anything up. Inspect the repos to ground-truth each claim.

1. **Read the existing project docs** in the docs directory. CLAUDE.md
   has the thesis. Decision-log.md has decisions chronologically.
   Open-questions.md has what's deferred. App-catalogue.md has the
   kid PWAs.

2. **Inspect the api/ directory** (or wherever the Cloudflare Worker
   API lives — find it). Check:
   - Does the migration file exist and match what Decision-log.md says?
   - Which routes are implemented? Look at src/routes/ or equivalent.
   - Is the email sender still a stub, or has a real provider been wired?
   - Is Stripe integration present? Look for any stripe import, webhook
     route, or subscription-related code beyond the schema.
   - Does CORS configuration exist for the launcher's dev origin?
   - Does the /profiles/deselect endpoint exist?
   - Are the tests passing? Run `npm test` or equivalent if it's quick.

3. **Inspect the auth-client/ directory**. Check:
   - Are all dist outputs being built (ESM, CJS, IIFE, types)?
   - Has the staleWhileRevalidate -> allowStaleFallback rename happened?
   - Tests passing?

4. **Inspect the launcher/ directory**. Check:
   - Which routes are implemented (SignIn, ProfilePicker, AppGrid,
     ParentDashboard, etc.)?
   - Has the design pass landed, or is it still placeholder visuals?
     Look at tailwind.config and styles — placeholder visuals will have
     default Tailwind slate/indigo; a design pass will have a custom
     palette and probably custom fonts.
   - Is the PWA manifest present and valid?
   - Is the auth-client imported via file: dependency or something else?
   - Tests passing?

5. **Check for a marketing site repo or directory.** If it exists,
   report on it. If not, say "Not started."

6. **Check for an admin console.** Same.

7. **Check for any kid PWA retrofits.** Look at the apps listed in
   App-catalogue.md — has any of them been wired to import the
   auth-client? Look in those repos if they're accessible; if they're
   not in this workspace, say so and report based on what App-catalogue.md
   claims.

## Tone and length

- Plain prose. No bullets unless a section genuinely benefits — usually
  Known issues is the only one that does.
- No marketing language. "Built and tested" not "robustly engineered."
- Match the voice of the existing docs (CLAUDE.md is the reference).
- No emoji, no status badges, no decorative ASCII.
- If something is half-built, say so plainly. "Stripe checkout flow is
  scaffolded but does not yet hit Stripe API" is better than "Stripe
  integration in progress."

## What to do if claims in existing docs don't match the code

The code wins. If Decision-log.md says X was decided but the code shows
Y was built, report Y as the current state, and add a line to Known
issues / debts noting the divergence. Don't try to reconcile in the
docs — that's a separate decision for the owner.

## Output

Write STATUS.md to the docs directory. Do not also produce a summary
or commentary — just the file. After writing it, list:
- The path you wrote to
- A one-line summary of what each section says
- Any divergences between Decision-log.md and the actual code state

If you're uncertain about anything material (e.g. you can't access a
repo you need to inspect), stop and ask before writing.

## Definition of done

- STATUS.md exists in the correct location.
- All five required sections present, in order, with the specified headings.
- Under 500 words total.
- Every claim is grounded in inspected code or existing docs, not assumed.
- Divergences between docs and code are surfaced in Known issues.