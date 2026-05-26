This project is RumpusRoom, a paid kid-software ecosystem positioned as the
safe, ad-free, data-collection-free app drawer for kids' tablets.

Product thesis:
- One subscription unlocks a growing catalogue of kid PWAs
- Flagship app is Mr Know-it-all, an AI voice Q&A for kids
- Marketed on safety, privacy, no ads, no data collection
- Target buyer is parents of kids ~3-10

Architecture:
- rumpusroom.org = marketing and onboarding (Astro on Cloudflare Pages)
- rumpusroom.app = authenticated product surface (launcher PWA + kid PWAs as subdomains)
- api.rumpusroom.app = Cloudflare Worker, D1 for relational data, KV for sessions
- admin.rumpusroom.app = admin console (gated by email allowlist)
- Shared cross-subdomain session cookie, /me endpoint each kid PWA calls
- Stripe for billing (monthly/annual + metered usage on Mr Know-it-all)

Founder context:
- Solo, employed full-time at ASD, two young kids, ~5-10 hrs/week build velocity
- 10 years engineering experience, comfortable with the stack
- Already has six PWAs built individually deployed to Cloudflare
- Has confirmed outside-employment posture re: ASD (or is in process)

Product decisions made:
- Co-parent support from day one, free
- Unlimited kid profiles, not a pricing dimension
- Magic link auth default, Google sign-in later, password optional
- Monthly + annual (annual ~30% off), no card required for trial
- Trial is in-app preview minutes per app, not a full timed trial
- Hard quota on Mr Know-it-all metered usage, no overage billing
- One-click cancel, no dark patterns
- 14-day dunning grace, degrade-don't-cut on payment failure
- 90-day data retention after cancel, then hard delete
- Collect minimum data on kids: display name + preset avatar only
- Parent self-serve data export and account delete

How I want Claude to work with me:
- Be direct and realistic, not a cheerleader
- Push back when you think I'm wrong, especially on scope creep
- Prefer the simplest thing that ships over the most elegant architecture
- When I'm reaching for a platform-first solution, check if a product-first one works
- Flag risks early; I'd rather hear bad news at week 2 than week 20
- Keep formatting light; prose over bullets unless bullets actually help