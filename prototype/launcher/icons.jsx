// launcher/icons.jsx
// Wordmark mark, UI icons, app catalogue icons.

// ===== Wordmark mark =====
// Half-disc doorway with a small filled circle for the knob.
function MarkDoorway({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <path d="M2 21 V11 a9 9 0 0 1 18 0 V21 Z" fill="currentColor" />
      <circle cx="15" cy="14" r="1.4" fill="var(--paper)" />
    </svg>
  );
}

function Wordmark({ size = 26, color = "var(--ink)" }) {
  return (
    <span className="brand" style={{ fontSize: size, color }}>
      <span className="mark" style={{ width: size * 0.85, height: size * 0.85 }}>
        <MarkDoorway size={size * 0.85} />
      </span>
      <span className="name">rumpus<em>room</em></span>
    </span>
  );
}

// ===== UI icons =====
const IconArrowRight = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconArrowLeft = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M13 8H3m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPlus = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconMail = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="1.8" y="3.5" width="12.4" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 4.5l6 4.5 6-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheck = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconLock = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 7V5a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const IconSignOut = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M9 3H4.5A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M11 5.5 13.5 8 11 10.5M7 8h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconUser = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3 13c.8-2.4 2.8-3.6 5-3.6S12.2 10.6 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconChevron = ({ s = 16, dir = "right" }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"
       style={{ transform: dir === "left" ? "rotate(180deg)" : "" }}>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconRefresh = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9L13.5 5.7M13.5 8a5.5 5.5 0 0 1-9.4 3.9L2.5 10.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M11 2.5v3.2h3.2M5 13.5v-3.2H1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ===== App icons =====
// Each is a 64x64 SVG meant to be tinted against a soft background tile.

const AppIconMrKnow = () => ( // microphone
  <svg viewBox="0 0 64 64" fill="none">
    <rect x="24" y="8" width="16" height="30" rx="8" fill="currentColor" />
    <path d="M14 32a18 18 0 0 0 36 0" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <line x1="32" y1="50" x2="32" y2="58" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <line x1="22" y1="58" x2="42" y2="58" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
  </svg>
);

const AppIconKaleido = () => ( // 6-petal mandala
  <svg viewBox="0 0 64 64" fill="none">
    <g transform="translate(32 32)">
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-14" rx="6" ry="14" fill="currentColor"
          transform={`rotate(${i * 60})`} opacity={i % 2 ? 0.55 : 1} />
      ))}
      <circle r="5" fill="var(--paper)" />
    </g>
  </svg>
);

const AppIconFlipa = () => ( // stacked pages with corner curl
  <svg viewBox="0 0 64 64" fill="none">
    <rect x="14" y="20" width="32" height="40" rx="3" fill="currentColor" opacity="0.45" />
    <rect x="18" y="14" width="32" height="40" rx="3" fill="currentColor" opacity="0.75" />
    <rect x="22" y="8"  width="32" height="40" rx="3" fill="currentColor" />
    <path d="M46 8 L54 16 L46 16 Z" fill="var(--paper)" opacity="0.85" />
    <circle cx="32" cy="24" r="2.2" fill="var(--paper)" />
    <path d="M28 32 L38 32 M28 38 L42 38" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const AppIconTalkingTom = () => ( // speech bubble with cat ears
  <svg viewBox="0 0 64 64" fill="none">
    <polygon points="14,16 22,4 22,18" fill="currentColor" />
    <polygon points="50,16 42,4 42,18" fill="currentColor" />
    <path d="M10 28a14 14 0 0 1 14-14h16a14 14 0 0 1 14 14v8a14 14 0 0 1-14 14h-8l-8 8v-8h-0a14 14 0 0 1-14-14Z" fill="currentColor" />
    <circle cx="26" cy="32" r="3" fill="var(--paper)" />
    <circle cx="38" cy="32" r="3" fill="var(--paper)" />
    <path d="M28 40 Q32 44 36 40" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

const AppIconFilters = () => ( // face oval + sparkle
  <svg viewBox="0 0 64 64" fill="none">
    <ellipse cx="30" cy="34" rx="16" ry="20" fill="currentColor" />
    <circle cx="25" cy="32" r="2.4" fill="var(--paper)" />
    <circle cx="35" cy="32" r="2.4" fill="var(--paper)" />
    <path d="M24 42 Q30 47 36 42" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* sparkle */}
    <g transform="translate(48 16)">
      <path d="M0 -8 L1.6 -1.6 L8 0 L1.6 1.6 L0 8 L-1.6 1.6 L-8 0 L-1.6 -1.6 Z" fill="currentColor" />
    </g>
    <circle cx="50" cy="30" r="2" fill="currentColor" />
  </svg>
);

const AppIconDinner = () => ( // plate + fork
  <svg viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="34" r="20" fill="currentColor" />
    <circle cx="32" cy="34" r="12" fill="var(--paper)" />
    <circle cx="32" cy="34" r="6"  fill="currentColor" opacity="0.4" />
    {/* fork on left */}
    <line x1="12" y1="10" x2="12" y2="30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="10" y1="10" x2="10" y2="18" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" />
    <line x1="14" y1="10" x2="14" y2="18" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" />
  </svg>
);

// App catalogue — slug, name, description (for tile hover/sub), icon component,
// tile background tint var, icon color, mock launch URL.
const APPS = [
  { slug: "mr-know-it-all",     name: "Mr Know-it-all", desc: "Ask anything",         icon: AppIconMrKnow,      bg: "var(--accent-soft)", color: "var(--accent)", launchUrl: "https://mrknow.rumpusroom.app/" },
  { slug: "kaleidoscope-camera",name: "Kaleidoscope",   desc: "Camera magic",          icon: AppIconKaleido,     bg: "var(--lilac-soft)",  color: "var(--lilac)",  launchUrl: "https://kaleidoscope.rumpusroom.app/" },
  { slug: "flipa-clone",        name: "Flip Studio",    desc: "Frame-by-frame art",    icon: AppIconFlipa,       bg: "var(--moss-soft)",   color: "var(--moss)",   launchUrl: "https://flip.rumpusroom.app/" },
  { slug: "talking-tom-clone",  name: "Echo",           desc: "Talk back, character", icon: AppIconTalkingTom,  bg: "var(--berry-soft)",  color: "var(--berry)",  launchUrl: "https://echo.rumpusroom.app/" },
  { slug: "filter-app",         name: "Funny Face",     desc: "Selfie filters",        icon: AppIconFilters,     bg: "var(--butter-soft)", color: "oklch(0.55 0.13 70)", launchUrl: "https://faces.rumpusroom.app/" },
  { slug: "dinner-planner",     name: "Dinner Vote",    desc: "Pick tonight's tea",    icon: AppIconDinner,      bg: "var(--sky-soft)",    color: "var(--sky)",    launchUrl: "https://dinner.rumpusroom.app/" },
];

const APP_BY_SLUG = Object.fromEntries(APPS.map(a => [a.slug, a]));

Object.assign(window, {
  Wordmark, MarkDoorway,
  IconArrowRight, IconArrowLeft, IconPlus, IconMail, IconCheck,
  IconLock, IconSignOut, IconUser, IconChevron, IconRefresh,
  APPS, APP_BY_SLUG,
});
