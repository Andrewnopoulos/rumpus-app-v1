// App catalogue — the six kid PWAs in the bundle. Each entry carries its slug
// (matching API entitlements), display name, one-line description, a geometric
// icon component, tile tint, icon colour, and launch URL.
// Ported from the locked design (prototype/launcher/icons.jsx).
//
// Four of six names are working titles; slugs are the contract. See README.

const AppIconMrKnow = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <rect x="24" y="8" width="16" height="30" rx="8" fill="currentColor" />
    <path d="M14 32a18 18 0 0 0 36 0" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <line x1="32" y1="50" x2="32" y2="58" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <line x1="22" y1="58" x2="42" y2="58" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
  </svg>
);

const AppIconKaleido = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <g transform="translate(32 32)">
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-14" rx="6" ry="14" fill="currentColor" transform={`rotate(${i * 60})`} opacity={i % 2 ? 0.55 : 1} />
      ))}
      <circle r="5" fill="var(--paper)" />
    </g>
  </svg>
);

const AppIconFlipa = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <rect x="14" y="20" width="32" height="40" rx="3" fill="currentColor" opacity="0.45" />
    <rect x="18" y="14" width="32" height="40" rx="3" fill="currentColor" opacity="0.75" />
    <rect x="22" y="8" width="32" height="40" rx="3" fill="currentColor" />
    <path d="M46 8 L54 16 L46 16 Z" fill="var(--paper)" opacity="0.85" />
    <circle cx="32" cy="24" r="2.2" fill="var(--paper)" />
    <path d="M28 32 L38 32 M28 38 L42 38" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const AppIconTalkingTom = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <polygon points="14,16 22,4 22,18" fill="currentColor" />
    <polygon points="50,16 42,4 42,18" fill="currentColor" />
    <path d="M10 28a14 14 0 0 1 14-14h16a14 14 0 0 1 14 14v8a14 14 0 0 1-14 14h-8l-8 8v-8h-0a14 14 0 0 1-14-14Z" fill="currentColor" />
    <circle cx="26" cy="32" r="3" fill="var(--paper)" />
    <circle cx="38" cy="32" r="3" fill="var(--paper)" />
    <path d="M28 40 Q32 44 36 40" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

const AppIconFilters = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <ellipse cx="30" cy="34" rx="16" ry="20" fill="currentColor" />
    <circle cx="25" cy="32" r="2.4" fill="var(--paper)" />
    <circle cx="35" cy="32" r="2.4" fill="var(--paper)" />
    <path d="M24 42 Q30 47 36 42" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <g transform="translate(48 16)">
      <path d="M0 -8 L1.6 -1.6 L8 0 L1.6 1.6 L0 8 L-1.6 1.6 L-8 0 L-1.6 -1.6 Z" fill="currentColor" />
    </g>
    <circle cx="50" cy="30" r="2" fill="currentColor" />
  </svg>
);

const AppIconDinner = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="20" fill="currentColor" />
    <circle cx="32" cy="34" r="12" fill="var(--paper)" />
    <circle cx="32" cy="34" r="6" fill="currentColor" opacity="0.4" />
    <line x1="12" y1="10" x2="12" y2="30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="10" y1="10" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="10" x2="14" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export interface AppEntry {
  slug: string;
  name: string;
  desc: string;
  icon: () => JSX.Element;
  bg: string;
  color: string;
  launchUrl: string;
}

export const APPS: AppEntry[] = [
  { slug: "mr-know-it-all", name: "Mr Know-it-all", desc: "Ask anything", icon: AppIconMrKnow, bg: "var(--accent-soft)", color: "var(--accent)", launchUrl: "https://mrknow.rumpusroom.app/" },
  { slug: "kaleidoscope-camera", name: "Kaleidoscope", desc: "Camera magic", icon: AppIconKaleido, bg: "var(--lilac-soft)", color: "var(--lilac)", launchUrl: "https://kaleidoscope.rumpusroom.app/" },
  { slug: "flipa-clone", name: "Flip Studio", desc: "Frame-by-frame art", icon: AppIconFlipa, bg: "var(--moss-soft)", color: "var(--moss)", launchUrl: "https://flip.rumpusroom.app/" },
  { slug: "talking-tom-clone", name: "Echo", desc: "Talk back, character", icon: AppIconTalkingTom, bg: "var(--berry-soft)", color: "var(--berry)", launchUrl: "https://echo.rumpusroom.app/" },
  { slug: "filter-app", name: "Funny Face", desc: "Selfie filters", icon: AppIconFilters, bg: "var(--butter-soft)", color: "oklch(0.55 0.13 70)", launchUrl: "https://faces.rumpusroom.app/" },
  { slug: "dinner-planner", name: "Dinner Vote", desc: "Pick tonight's tea", icon: AppIconDinner, bg: "var(--sky-soft)", color: "var(--sky)", launchUrl: "https://dinner.rumpusroom.app/" },
];

export const APP_BY_SLUG: Record<string, AppEntry> = Object.fromEntries(APPS.map((a) => [a.slug, a]));

/**
 * Resolve an app's launch URL for the environment the launcher is running in.
 * The same bundle is served on staging and prod, so we derive the kid-app
 * origin from the launcher's own hostname rather than baking it in at build
 * time: on a `*.staging.rumpusroom.app` launcher, a prod kid-app host like
 * `kaleidoscope.rumpusroom.app` is rewritten to `kaleidoscope.staging.rumpusroom.app`.
 * On prod (or localhost) the authored prod URL is returned unchanged.
 */
export function resolveLaunchUrl(launchUrl: string): string {
  if (typeof window === "undefined") return launchUrl;
  const host = window.location.hostname;
  const onStaging = host === "staging.rumpusroom.app" || host.endsWith(".staging.rumpusroom.app");
  if (!onStaging) return launchUrl;
  try {
    const u = new URL(launchUrl);
    if (u.hostname.endsWith(".rumpusroom.app") && !u.hostname.endsWith(".staging.rumpusroom.app")) {
      u.hostname = u.hostname.replace(/\.rumpusroom\.app$/, ".staging.rumpusroom.app");
    }
    return u.toString();
  } catch {
    return launchUrl;
  }
}
