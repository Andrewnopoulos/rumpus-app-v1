// Wordmark mark + UI icon set. Ported from the locked design
// (prototype/launcher/icons.jsx). All use currentColor.

interface IconProps {
  s?: number;
}

export function MarkDoorway({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <path d="M2 21 V11 a9 9 0 0 1 18 0 V21 Z" fill="currentColor" />
      <circle cx="15" cy="14" r="1.4" fill="var(--paper)" />
    </svg>
  );
}

export function Wordmark({ size = 26, color = "var(--ink)" }: { size?: number; color?: string }) {
  return (
    <span className="brand" style={{ fontSize: size, color }}>
      <span className="mark" style={{ width: size * 0.85, height: size * 0.85 }}>
        <MarkDoorway size={size * 0.85} />
      </span>
      <span className="name">
        rumpus<em>room</em>
      </span>
    </span>
  );
}

export const IconArrowRight = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconArrowLeft = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M13 8H3m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconPlus = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
export const IconMail = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="1.8" y="3.5" width="12.4" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 4.5l6 4.5 6-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconCheck = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconLock = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 7V5a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
export const IconSignOut = ({ s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M9 3H4.5A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M11 5.5 13.5 8 11 10.5M7 8h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconChevron = ({ s = 16, dir = "right" }: IconProps & { dir?: "left" | "right" }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ transform: dir === "left" ? "rotate(180deg)" : "" }}>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
