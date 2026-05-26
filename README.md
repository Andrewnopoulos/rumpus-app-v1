# Handoff: RumpusRoom Launcher PWA

## Overview

This package contains the **visual design pass** for the RumpusRoom launcher PWA described in `docs/THIRD_BUILD_BRIEF.md`. The brief calls out a "functional skeleton with placeholder visuals" and explicitly defers styling — this handoff is that styling pass.

Everything in this bundle is **design reference**, not production code. Your job is to recreate it in the target stack the brief mandates:

- Vite + React 18 + TypeScript
- React Router 6
- Tailwind CSS
- `vite-plugin-pwa`
- `@rumpusroom/auth-client` for session
- Vitest + RTL

All routes, auth wiring, API contracts, state flow, and test requirements are in the third build brief — this README only covers **the design**. Read the brief first; treat this as the styling/visual companion to it.

## About the design files

The HTML/JSX files in `prototype/` were authored as design references using React inline-Babel — they are not the production build target. They use plain CSS variables instead of Tailwind, mock data instead of `@rumpusroom/auth-client`, and a single-state `route` string instead of React Router. Recreate the look and behaviour in the production stack using the brief's file layout (`src/routes/SignIn.tsx`, `src/routes/AppGrid.tsx`, etc.).

## Fidelity

**High-fidelity.** Final colours, typography, spacing, copy, micro-interactions, and component styling are all locked. Match exactly. The four palettes (Clay / Sea / Sage / Sunday) are all valid directions — the founder will pick one before launch; until then the Clay palette is the default. Build the palette switching as a CSS-variable swap on `<html data-palette="...">` so changing the default is a one-line edit.

## Files in this bundle

```
design_handoff_launcher/
├── README.md                         (this file)
├── prototype/
│   ├── launcher.html                 (entry — loads everything)
│   ├── canvas.html                   (palette + state variants, side-by-side)
│   └── launcher/
│       ├── theme.css                 (all design tokens + base styles)
│       ├── avatars.jsx               (12 animal avatar SVG components)
│       ├── icons.jsx                 (wordmark mark, UI icons, 6 app icons, app catalogue)
│       ├── screens.jsx               (all 7 routes + 2 modals as React components)
│       ├── app.jsx                   (mock router + tweaks integration)
│       ├── tweaks-panel.jsx          (UI for previewing palette/state — not for production)
│       └── design-canvas.jsx         (canvas-only — not for production)
```

To preview: open `prototype/launcher.html` in a browser. To preview variants side-by-side: open `prototype/canvas.html`. The Tweaks panel (bottom-right) lets you jump between routes and palettes.

---

## Visual system

### Type pairing

Two fonts, both from Google Fonts:

- **Instrument Serif** — display/wordmark. Used for h1/h2/h3, the wordmark, large "Hi, Emma!" greeting. Both upright and italic styles. Weight 400 only.
- **Manrope** — UI. All body, labels, buttons, chips, inputs. Weights 400/500/600/700/800.

Type scale (all in px, line-heights tuned for Instrument Serif italic which has tall ascenders/descenders):

| Role            | Family             | Size  | Weight | Line-height | Letter-spacing |
|-----------------|-------------------|-------|--------|-------------|----------------|
| h1 (display)    | Instrument Serif   | 52–76 | 400    | 1.12–1.18   | -0.01em        |
| h2 (display)    | Instrument Serif   | 32–36 | 400    | 1.12        | -0.01em        |
| h3              | Instrument Serif   | 24    | 400    | 1.12        | -0.01em        |
| Body            | Manrope            | 16    | 400    | 1.45        | -0.005em       |
| Body large      | Manrope            | 17    | 400    | 1.45        | -0.005em       |
| Field label     | Manrope            | 13    | 600    | 1.45        | -0.005em       |
| Button          | Manrope            | 15    | 600    | 1           | -0.005em       |
| Eyebrow         | Manrope            | 12    | 600    | 1           | 0.08em UPPER   |
| Chip            | Manrope            | 12    | 600    | 1           | -0.005em       |
| Muted small     | Manrope            | 12–13 | 400–500| 1.4         | normal         |

Italic spans inside h1/h2 carry character — kid greeting "Hi, **Emma!**", picker "Who's playing **today?**", dashboard "The **Wallace** account." Use real `<em>` tags with `font-style: italic` and slightly muted colour for the proper noun where appropriate.

### Colour tokens (Clay — default palette)

All colours are oklch. The full token set lives in `prototype/launcher/theme.css`. Reproduce them as CSS custom properties or as a Tailwind theme extension — do not bake hex equivalents in, oklch lets the four palettes share structure.

```css
/* Clay (default) */
--paper:       oklch(0.972 0.013 80);   /* main background */
--paper-2:     oklch(0.95  0.018 75);   /* slightly deeper */
--card:        oklch(0.992 0.006 80);   /* card surface */
--card-2:      oklch(0.97  0.01  78);   /* hover / list rows */
--ink:         oklch(0.22  0.025 50);   /* primary text, btn-primary bg */
--ink-2:       oklch(0.36  0.022 50);   /* secondary text */
--ink-3:       oklch(0.55  0.018 55);   /* muted text */
--border:      oklch(0.89  0.013 70);
--border-2:    oklch(0.93  0.012 75);

--accent:      oklch(0.62  0.135 42);   /* terracotta — primary accent */
--accent-soft: oklch(0.93  0.045 50);   /* terracotta wash for chips/bg */

--moss:        oklch(0.58  0.07  150);  /* success / live dot */
--moss-soft:   oklch(0.93  0.035 145);

--sky:         oklch(0.66  0.10  235);
--sky-soft:    oklch(0.93  0.035 230);

--butter:      oklch(0.88  0.09  92);
--butter-soft: oklch(0.95  0.04  92);

--berry:       oklch(0.66  0.13  355);
--berry-soft:  oklch(0.94  0.04  355);

--lilac:       oklch(0.70  0.09  300);
--lilac-soft:  oklch(0.94  0.04  300);
```

The other three palettes (Sea, Sage, Sunday) override the same token names — see `theme.css` `[data-palette="sea"]` etc. Dark mode uses `[data-dark="true"]` and is **parent screens only**; kid screens stay light.

### Tailwind translation

Wire these via `tailwind.config.ts` `theme.extend.colors`:

```ts
colors: {
  paper:   "oklch(var(--paper) / <alpha-value>)",
  ink:     "oklch(var(--ink)   / <alpha-value>)",
  // ...
}
```

…and emit the raw oklch values from a `<style>` in `index.html` (or a global stylesheet) so palette switching stays a `data-palette` attribute swap. Alternative: use `oklch(L C H)` literals as Tailwind colour values directly — but you lose the palette-swap mechanic.

Two soft background washes drive the warmth across every screen:

```css
.shell-bg {
  background:
    radial-gradient(1100px 600px at 88% -10%, var(--accent-soft) 0%, transparent 60%),
    radial-gradient(900px 500px at -10% 110%, var(--moss-soft)  0%, transparent 55%),
    var(--paper);
}
```

Keep these on every full-page surface. They're what makes the launcher feel like a room with light coming in.

### Radii + shadows + motion

```css
--r-sm: 10px;  --r-md: 14px;  --r-lg: 20px;  --r-xl: 28px;  --r-pill: 999px;

--shadow-card: 0 1px 0 oklch(0.99 0.005 80 / 0.6) inset,
               0 10px 28px oklch(0.45 0.04 50 / 0.06);
--shadow-pop:  0 1px 0 oklch(0.99 0.005 80 / 0.6) inset,
               0 20px 60px oklch(0.40 0.04 50 / 0.16);

--ease:        cubic-bezier(0.22, 1, 0.36, 1);  /* used for every transition */
```

Tile hover: `transform: translateY(-3px); box-shadow: var(--shadow-pop)`; 220ms with `--ease`. Button hover: `translateY(-1px)`, 140ms. Always subtle.

### Shape language

- Rounded squares for app tiles (28px radius)
- Pills for all buttons (44px tall standard, 34px small, 52px large)
- Circles for avatars (124px standard in picker, 84px in dashboard rows, 28px in switch-profile button, 160px in add-profile preview)
- Soft warm shadows only, never harsh black drop-shadows

---

## Wordmark + brand mark

Set "rumpus**room**" all lowercase in **Instrument Serif 26px** (header) — "room" wraps in `<em>` to italicise. Preceded by a small filled **half-disc with a paper-colour dot** — a stylised arched doorway (the room you step into). Both elements use `currentColor`.

```html
<span class="brand">
  <svg width="22" height="22" viewBox="0 0 22 22">
    <path d="M2 21 V11 a9 9 0 0 1 18 0 V21 Z" fill="currentColor" />
    <circle cx="15" cy="14" r="1.4" fill="var(--paper)" />
  </svg>
  <span>rumpus<em>room</em></span>
</span>
```

No other graphical logo treatment. The mark stays inline with the wordmark; never floats alone larger than 32px in product chrome.

---

## Screens

Refer to `prototype/launcher/screens.jsx` for the exact JSX of each screen — copy markup intent, recreate with Tailwind + the production component patterns. Route names map 1:1 to the third brief's React Router paths.

### 1. `/signin` — `SignIn.tsx`

**Layout.** Full-bleed `.shell-bg` background. Top bar with wordmark left, ghost "About" link right. Centred column max-width 460px.

Content stack:
1. Optional banner at top (only when `?from=` or `?reason=` query param is present — see brief).
2. Centred eyebrow `• Welcome home` with moss live dot.
3. Display headline (Instrument Serif 64px): `Step into the *rumpus room*.` — "rumpus room" italicised.
4. Muted subtitle: "One quiet account for the grown-ups. A safe play space for the kids."
5. Card (`var(--card)`, 24px padding, 20px radius):
   - Field label "Parent email"
   - Email input (52px tall, full width)
   - Primary button "Send sign-in link" with right-arrow icon — full width, large (52px tall).
   - Microcopy below button: "We'll email you a one-time link. No passwords to remember."
6. Trust-chip row centred below card: `✓ No ads, ever` · `✓ No data on kids` · `✓ Cancel anytime`.

**Behaviour.** Email validation: regex `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`. On submit, call API per brief, navigate to `/signin/sent` on success. Show inline error message in `var(--accent)` colour below the field on failure. Per the brief, surface 429 (rate limited) with specific copy.

### 2. `/signin/sent` — `SignIn.tsx` "sent" state

**Layout.** Same shell. Centred column max 480px.

1. 120px circular swatch (moss-soft bg) with a hand-drawn envelope-with-checkmark SVG (see prototype).
2. Display headline: "Check your email."
3. Body: "We sent a sign-in link to **{email}**. It's good for 15 minutes."
4. Row of two buttons: secondary "Use a different email" (back to `/signin`), primary "I clicked the link" — *omit the prototype's "I clicked the link" button in production*; that was a demo affordance to fake the consume step. The real flow returns from `/auth/consume` on the API. Production sent screen has only the "Use a different email" button.

### 3. `/profiles` — `ProfilePicker.tsx`

**Layout.** Shell + top bar (wordmark left, ghost "Sign out" right).

1. Centred eyebrow "• You're signed in" with moss live dot.
2. Headline: `Who's playing *today?*` (60px, italic "today?").
3. Muted subtitle: "Tap a face to hand the tablet over. The grown-up tile stays for you."
4. Grid (`grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`, gap 16px, max-width 880px centred):
   - One tile per profile: 124px circular avatar swatch on tinted bg + display_name below
   - One **dashed-border** tile "Add a profile" with `+` icon
   - One **dark** tile "Grown-ups" with subtitle "Subscription & profiles" — bg is `var(--ink)`, icon and text in paper colour. Routes to `/dashboard`.
5. Empty state (no profiles): centred card max 520px, "Add your first kid" with primary "+ Add a profile" button.

**Tile hover.** `translateY(-3px) + shadow-pop`, 220ms.

**Banner.** If `?reason=` query param is set, render banner above the heading (see Banners section below).

### 4. `/apps` — `AppGrid.tsx`

**Layout.** Shell + top bar (wordmark left, **switch-profile pill** right).

The switch-profile pill: a pill-shaped button with the active profile's 28px avatar in a small circle on the left, and text "Not Emma?" (substitute name). On tap, opens the **Switch profile modal** (see Modals).

1. Greeting row: 104px avatar swatch left, then h1 (72px, line-height 1.18): `Hi, *Emma!*` and a muted line "Pick something to play. You have 6 apps ready."
2. App grid (`grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`, gap 16px). Each `.app-tile`:
   - 200px min height, 20px padding, 28px radius, `var(--card)` bg, 0.5px `var(--border)`.
   - 84px square icon tile at top-left, 22px radius, tinted background (see app catalogue).
   - App name (Manrope 17/700) + one-line description (13px muted).
   - Bottom-aligned "Open →" link in muted ink-3 colour, 13px/600.
3. Empty state (zero entitled apps): centred card "No apps yet" + "Ask a grown-up to turn on your subscription."

### 5. `/dashboard` — `ParentDashboard.tsx`

Two-column grid `grid-template-columns: 2fr 1.1fr` (collapses to single column below 880px). Top bar has a "← Profiles" ghost button on the left, then a 1px divider, then the wordmark; right side shows the parent's email muted and a "Sign out" ghost button.

Header block (above the grid):
1. Eyebrow "• Grown-up area"
2. h1 (52px): `The *Wallace* account.` (family display name italicised)
3. Muted subtitle: "Subscription, profiles, and quiet controls. Sensitive changes will ask for a fresh email link."

**Left column** (stack, gap 20px):

- **Subscription card** (28px padding):
  - Top row: left has eyebrow "Subscription" + plan name (Instrument Serif 34px) + status chip with appropriate dot colour.
  - Right has a context-aware action button: "Upgrade to paid" (trialing, accent), "Manage billing" (active, secondary), "Start subscription" (none, accent).
  - Bottom row: three labelled metrics — Renews / Apps unlocked / Co-parents.

- **Profiles list card**:
  - Header row: "Kid profiles" eyebrow left, small "+ Add a profile" secondary button right.
  - One row per profile: 44px avatar, display_name + "Age X–Y · Added 28 May 2026" muted small. Trailing ghost "Edit" button (no-op for v0 per brief).
  - Empty state inline: muted line "No profiles yet. Add one so the kids have somewhere to land."

- **In the bundle card** (24px padding):
  - Eyebrow "In the bundle" left, "One subscription, every app." muted right.
  - 3-column inner grid showing each app: small 40px icon + name + description, on `var(--card-2)` rounded-14 background.

**Right column** (stack, gap 20px):

- **Plan KPI card**: label "Plan" / value "$11.50/mo" (Instrument Serif 40px, "/mo" smaller muted) / sub "Billed monthly in AUD. Annual save ~30%." / accent-coloured link "Switch to annual →". **Pricing is a placeholder** — see Open Questions in the project docs.

- **Mr Know-it-all usage card**: eyebrow "Mr Know-it-all usage" / "34 of 200 voice turns this month" / 6px-tall progress bar (filled with accent colour). Muted footer: "Hard quota. No bill shock. Resets {date}." Quota model isn't decided yet — design supports any single-metric quota.

- **Account card**: eyebrow "Account" / list of action rows:
  - "Invite a co-parent" → chevron, label "Free"
  - "Change parent email" → lock icon + "Sensitive" label (this action requires `/auth/elevate` per the auth brief)
  - "Export my data" → chevron
  - "Cancel subscription" (label in `var(--accent)` colour) → lock icon + "Sensitive"

All "Sensitive" rows must trigger the elevation flow in production. In the prototype they show a toast.

### 6. `/locked` — `Locked.tsx`

Centred card (520px max, 36px padding) on shell-bg. Renders the `?from=` app context as a small pill at the top of the card (28px icon + app name). Then a large emoji glyph, an h2 headline, a muted paragraph, and a primary CTA. Three message variants by `?reason=`:

- `locked`: "This one needs a subscription." / "Looks like the bundle is paused. Pop back to your account to turn it on."
- `expired`: "You've been away a while." / "We logged you out for safety. Sign in to pick up where you left off."
- `unauthenticated`: "Sign in to keep playing." / "You'll just need the parent email."

CTA is "Open my account →" if a session exists, otherwise "Sign in →".

### 7. Loading

Centred wordmark + small "Loading…" muted line on shell-bg. Shown only during the initial `/me` fetch per the brief's routing logic.

---

## Modals

### Add-profile modal

Triggered from the picker's "Add a profile" tile or the dashboard's "+ Add a profile" button. Backdrop is `oklch(0.22 0.025 50 / 0.42)` with `backdrop-filter: blur(8px)`, 200ms fade-in. Modal card is 720px max-width, 28px padding, 28px radius, `shadow-pop`.

Layout:
- Header row: left has eyebrow "New profile" + h2 "Who's joining?"; right has a "Close" ghost button.
- Muted intro: "A first name and an animal is all we need. You can change either later."
- Two-column form (1fr + 220px):
  - Left: name input (52px field), Age band chips (Under 5 / 5–7 / 8–10 — single-select, optional, toggleable).
  - Right: live 160px preview of the selected avatar with a paper-colour ring + animal name label.
- Avatar grid (6 columns, gap 10px): each cell is a 1:1 button with the avatar SVG on its tinted background. Already-used avatars dim to 0.3 opacity and disable. Selected has 2px solid `var(--ink)` border.
- Footer row: ghost "Cancel" / primary "✓ Add {name}". Primary disabled until name is non-empty.

Validation matches the API in the initial brief: trim, 1–30 chars, avatar_id 0–19. On 409 (duplicate avatar), show inline error and surface the suggested next unused avatar_id from the API response.

### Switch-profile modal (kid mode)

Triggered from the kid app grid's "Not Emma?" pill. 520px max modal, centred content. Warning swatch (96px circle, accent-soft bg) with a stroked triangle-exclamation. h2 "Ask a grown-up." Muted line "Swapping profiles needs a grown-up tap. {kid name}, hand the tablet over for a sec." Two buttons: secondary "Keep playing" (close), primary "I'm the grown-up" → calls `POST /profiles/deselect` per the third brief, then routes to `/profiles`.

---

## Banners

For the `?from=&reason=` redirect-back state on `/signin` and `/profiles`. Pill-styled with icon + text, full-width above the heading, 14px font, 14px vertical padding, `var(--r-md)` radius, 0.5px border:

- `tone="info"` → `var(--moss-soft)` background
- default → `var(--accent-soft)` background

Copy lines (from the brief):
- locked: "This app needs a subscription. Sign in to manage your account."
- expired: "Your session expired. Sign in again."
- unauthenticated: "Please sign in to continue."

---

## App catalogue

Six apps. Each has slug, display name, one-line description, icon component, tinted background colour, icon colour, launch URL. See `prototype/launcher/icons.jsx` for the SVG source of each icon.

| slug                   | Name           | Description           | Bg              | Icon colour   |
|------------------------|----------------|-----------------------|-----------------|---------------|
| mr-know-it-all         | Mr Know-it-all | Ask anything          | --accent-soft   | --accent      |
| kaleidoscope-camera    | Kaleidoscope   | Camera magic          | --lilac-soft    | --lilac       |
| flipa-clone            | Flip Studio    | Frame-by-frame art    | --moss-soft     | --moss        |
| talking-tom-clone      | Echo           | Talk back, character  | --berry-soft    | --berry       |
| filter-app             | Funny Face     | Selfie filters        | --butter-soft   | butter-700    |
| dinner-planner         | Dinner Vote    | Pick tonight's tea    | --sky-soft      | --sky         |

App names other than "Mr Know-it-all" and "Kaleidoscope" are **placeholders** — the brief uses the technical slugs, not final product names. Confirm final names with the founder.

The icon SVGs are geometric/symbolic:

- **Mr Know-it-all**: microphone — rounded-rect stem + arc + stand
- **Kaleidoscope**: 6-petal mandala — six ellipses rotated around centre, alternating opacity, paper-colour disc on top
- **Flip Studio**: three stacked rounded-rect pages with a corner-curl detail
- **Echo**: speech bubble with two triangle cat-ears
- **Funny Face**: face oval with smile + 4-point sparkle in corner
- **Dinner Vote**: plate (concentric circles) + fork (3 tines)

All sit on a 64×64 viewBox, use `currentColor` for the icon mark and `var(--paper)` for inset highlights.

---

## Avatar catalogue

12 animal avatars. Each is a React component returning a 100×100 SVG composed entirely from circles, ellipses, polygons, and paths — no external images. Source: `prototype/launcher/avatars.jsx`.

| id | Name      | Notes                                                   | Default bg   |
|----|-----------|---------------------------------------------------------|--------------|
| 0  | Fox       | Pointed ears, white muzzle triangle                     | butter-soft  |
| 1  | Bear      | Round head, rounded ears, lighter muzzle ellipse        | accent-soft  |
| 2  | Owl       | Concentric eye discs, tufted ears, triangle beak        | lilac-soft   |
| 3  | Cat       | Pink-inner ears, slit eyes, whiskers, small mouth lines | card-2       |
| 4  | Frog      | Twin bulging eyes on top of round green head            | moss-soft    |
| 5  | Panda     | Black ear circles, angled black eye patches             | card-2       |
| 6  | Rabbit    | Tall pink-inner ears, oval eyes                         | berry-soft   |
| 7  | Penguin   | Black body + white belly + orange triangle beak         | sky-soft     |
| 8  | Lion      | Scalloped mane (overlapping circles), small ears        | butter-soft  |
| 9  | Hedgehog  | Triangle-spike dome, small face with dark snout         | lilac-soft   |
| 10 | Whale     | Blue body with spout droplets, white underbelly         | sky-soft     |
| 11 | Deer      | Stroked antler paths, spots on face, pink inner-ears    | moss-soft    |

The API spec in the initial brief reserves avatar_id 0–19. We've designed 12; **add 8 more before production** or relax the validation to 0–11. Recommended add-ons (in keeping with the kid-friendly menagerie): koala, dolphin, raccoon, otter, sloth, monkey, mouse, sheep.

The `Avatar({ id, size, ring })` component:
- `size` (default 124) drives both width and height of the circular swatch
- `ring` (boolean) adds a paper-coloured halo + border outline — used in the add-profile preview only

---

## Buttons

Pill shape. Heights: standard 44px, small 34px, large 52px. Horizontal padding: 20/14/26 respectively. Font: Manrope 600, 15px standard / 13px small / 16px large.

| Variant      | Background       | Text colour | Border               | Use                                  |
|--------------|------------------|-------------|----------------------|--------------------------------------|
| `primary`    | `var(--ink)`     | `var(--paper)` | none              | Main CTA per screen                  |
| `secondary`  | `var(--card)`    | `var(--ink)`   | 0.5px `--border`  | Co-equal action / "Use different email" |
| `ghost`      | transparent      | `var(--ink-2)` | none              | Tertiary / "Sign out" / "Close"      |
| `accent`     | `var(--accent)`  | white-ish (`--accent-ink`) | none  | "Upgrade", "Start subscription"      |

Hover: `translateY(-1px)` + slight lightness shift via `oklch(from var(--ink) calc(l + 0.06) c h)`. 140ms `--ease`. Active resets translate. Disabled: `opacity: 0.5; pointer-events: none`.

Icon buttons: same heights, gap 8px between icon and label. Right-arrow icon on forward-progress CTAs ("Send sign-in link →", "I clicked the link →", "Open my account →").

---

## Chips

Pill, 12px text, 600 weight, 4px vertical / 10px horizontal padding, 0.5px `var(--border)` border.

- Default: `var(--card-2)` bg, `var(--ink-2)` text
- Accent: `var(--accent-soft)` bg
- Moss: `var(--moss-soft)` bg
- Butter: `var(--butter-soft)` bg
- Berry: `var(--berry-soft)` bg

The `dot` element inside chips: 8px circle. `dot.live` is moss with a 4px moss-soft halo, `dot.warn` is accent with accent-soft halo, `dot.off` is ink-3 plain.

---

## Forms

Field: 52px tall, 1px solid `var(--border)`, 14px radius, 18px horizontal padding, 16px font. On focus: border becomes `var(--ink)`, plus a 4px accent-soft glow (`box-shadow: 0 0 0 4px var(--accent-soft)`). Labels are 13px/600 Manrope in `var(--ink-2)`, 8px above the field.

---

## Toasts

Pill toast at bottom-centre, 28px above viewport bottom. Background `var(--ink)`, text `var(--paper)`, 12/18px padding, 14px font/500 weight, `var(--shadow-pop)`. Slides up + fades in over 240ms. Auto-dismiss 2.4s. Used for "Coming soon" stubs in the dashboard.

---

## Interactions summary

- **Tile hover**: translate -3px + shadow-pop, 220ms `--ease`. Apply to profile tiles, app tiles, "Grown-ups" tile.
- **Button hover**: translate -1px, 140ms.
- **Avatar pick (modal)**: scale 1.05 on hover, 160ms. Selected adds 2px ink border.
- **Modal in**: backdrop fades 200ms, card translates from `+12px / scale 0.98` to rest over 280ms `--ease`.
- **Toast in**: translate from `+8px` over 240ms.
- **Page transitions**: keep simple — the brief calls for React Router, so use its default transitionless behaviour. The interactivity is in the elements, not in route changes.

---

## State / routing

Read the third brief — the routes, auth provider, session shape, and routing logic on `/` are fully specified there. The prototype models routing as a single string state to keep the design file small; in production use React Router 6.

The prototype's mock session shape matches the real `/me` response — `session.profiles[]`, `session.parent`, `session.family`, `session.subscription.{status,plan,current_period_end}`, `session.entitlements.apps_unlocked[]`, `session.co_parents[]`. Plug straight into `useSession()` from the auth provider.

---

## Design tokens — full table for Tailwind

```
spacing:    0 2 3 4 5 6 8 10 12 (in 4px increments — 8 32 12 16 20 24 32 40 48)
radii:      sm 10, md 14, lg 20, xl 28, pill 999
shadow:     card, pop (see CSS above — both with paper-tinted inset highlight)
font:       display "Instrument Serif", sans "Manrope"
animation:  ease cubic-bezier(0.22, 1, 0.36, 1); durations 140 / 160 / 220 / 280
```

For Tailwind colour tokens map each oklch CSS variable to a colour key. Keep palette-switching alive by referencing the CSS variable, not the resolved value, in the Tailwind theme.

---

## Open / undecided

These came from `docs/Open-questions.md` and were placeholdered in the design — confirm before shipping:

- **Monthly + annual prices.** Used $11.50/mo as placeholder.
- **Mr Know-it-all quota.** Used "200 voice turns" as placeholder unit/ceiling.
- **App final names.** Four of six are working titles.
- **Default palette.** Built four; Clay is the default in the prototype. Founder to pick.
- **Avatar count.** 12 designed; brief reserves 20.

---

## What NOT to lift from the prototype

- The Tweaks panel + design canvas chrome (bottom-right floating panel) — that's a design-time affordance only.
- The "I clicked the link" button on `/signin/sent` — demo affordance; production has only "Use a different email".
- The mock data in `prototype/launcher/app.jsx` — replaced by the real `useSession()` provider.
- The single-string `route` state — replaced by React Router.
- `prototype/launcher/tweaks-panel.jsx` and `prototype/launcher/design-canvas.jsx` — preview tooling, not product code.

---

## Implementation suggestion

Build order:
1. Set up the Vite + React + TS + Tailwind + React Router scaffold per the third brief.
2. Wire up tokens: paste the CSS variable blocks into a global stylesheet, wire `tailwind.config.ts` to reference them.
3. Lift the 12 avatar SVGs from `avatars.jsx` → `src/lib/avatars.tsx` (the brief's expected location). Same for the 6 app icons → `src/lib/apps.ts` + per-icon component file.
4. Build the wordmark + icon set as primitives in `src/components/`.
5. Build screens in this order, since complexity ramps: Loading → SignIn → SignInSent → ProfilePicker → AppGrid → Locked → ParentDashboard. Modals last.
6. Wire the auth provider per the brief, then the API calls.
7. Tests per the brief's test list.

Reach out to the design pass before changing palette tokens, type pairing, or the wordmark — those are the load-bearing visual decisions.
