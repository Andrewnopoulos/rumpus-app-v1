// launcher/avatars.jsx
// 12 flat-illustrated animal faces, composed from simple shapes.
// Each is a React component returning a 100x100 SVG; sits on a tinted swatch.

const AvatarFox = () => (
  <svg viewBox="0 0 100 100">
    <polygon points="22,30 38,16 36,42" fill="#D97757" />
    <polygon points="78,30 62,16 64,42" fill="#D97757" />
    <polygon points="27,30 36,23 36,38" fill="#FFE6D6" />
    <polygon points="73,30 64,23 64,38" fill="#FFE6D6" />
    <ellipse cx="50" cy="60" rx="34" ry="31" fill="#E0825A" />
    <path d="M50 54 L32 80 Q50 92 68 80 Z" fill="#FFFBF2" />
    <ellipse cx="40" cy="58" rx="3.4" ry="4.2" fill="#1F1A14" />
    <ellipse cx="60" cy="58" rx="3.4" ry="4.2" fill="#1F1A14" />
    <ellipse cx="50" cy="72" rx="3.2" ry="2.6" fill="#1F1A14" />
  </svg>
);

const AvatarBear = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="28" cy="32" r="11" fill="#8E6B4F" />
    <circle cx="72" cy="32" r="11" fill="#8E6B4F" />
    <circle cx="28" cy="32" r="5.5" fill="#C7A37C" />
    <circle cx="72" cy="32" r="5.5" fill="#C7A37C" />
    <ellipse cx="50" cy="56" rx="34" ry="32" fill="#A37A56" />
    <ellipse cx="50" cy="68" rx="14" ry="11" fill="#E8CFAE" />
    <ellipse cx="40" cy="54" rx="3.2" ry="4" fill="#1F1A14" />
    <ellipse cx="60" cy="54" rx="3.2" ry="4" fill="#1F1A14" />
    <ellipse cx="50" cy="64" rx="3" ry="2.4" fill="#1F1A14" />
  </svg>
);

const AvatarOwl = () => (
  <svg viewBox="0 0 100 100">
    <polygon points="18,30 30,16 32,32" fill="#7B6A8C" />
    <polygon points="82,30 70,16 68,32" fill="#7B6A8C" />
    <ellipse cx="50" cy="56" rx="34" ry="34" fill="#9A89AE" />
    <path d="M16 56 Q50 30 84 56 Q50 50 16 56 Z" fill="#7B6A8C" opacity="0.45" />
    <circle cx="38" cy="56" r="11" fill="#FFFBF2" />
    <circle cx="62" cy="56" r="11" fill="#FFFBF2" />
    <circle cx="38" cy="58" r="5" fill="#1F1A14" />
    <circle cx="62" cy="58" r="5" fill="#1F1A14" />
    <circle cx="36.5" cy="56.5" r="1.2" fill="#FFF" />
    <circle cx="60.5" cy="56.5" r="1.2" fill="#FFF" />
    <polygon points="50,68 46,74 54,74" fill="#D97757" />
  </svg>
);

const AvatarCat = () => (
  <svg viewBox="0 0 100 100">
    <polygon points="22,42 28,16 42,32" fill="#5C5C66" />
    <polygon points="78,42 72,16 58,32" fill="#5C5C66" />
    <polygon points="27,38 31,24 38,32" fill="#E8A8B8" />
    <polygon points="73,38 69,24 62,32" fill="#E8A8B8" />
    <ellipse cx="50" cy="56" rx="32" ry="30" fill="#7A7A86" />
    <ellipse cx="40" cy="58" rx="3.8" ry="5" fill="#1F1A14" />
    <ellipse cx="60" cy="58" rx="3.8" ry="5" fill="#1F1A14" />
    <ellipse cx="50" cy="68" rx="2.6" ry="2" fill="#E8A8B8" />
    <path d="M50 70 Q44 76 42 74 M50 70 Q56 76 58 74" stroke="#1F1A14" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <line x1="20" y1="60" x2="32" y2="60" stroke="#1F1A14" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <line x1="68" y1="60" x2="80" y2="60" stroke="#1F1A14" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const AvatarFrog = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="32" cy="34" r="14" fill="#7FB069" />
    <circle cx="68" cy="34" r="14" fill="#7FB069" />
    <circle cx="32" cy="34" r="8" fill="#FFFBF2" />
    <circle cx="68" cy="34" r="8" fill="#FFFBF2" />
    <circle cx="32" cy="35" r="4" fill="#1F1A14" />
    <circle cx="68" cy="35" r="4" fill="#1F1A14" />
    <ellipse cx="50" cy="58" rx="36" ry="30" fill="#7FB069" />
    <path d="M28 60 Q50 78 72 60" stroke="#1F1A14" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="38" cy="62" r="1.6" fill="#1F1A14" opacity="0.6" />
    <circle cx="62" cy="62" r="1.6" fill="#1F1A14" opacity="0.6" />
  </svg>
);

const AvatarPanda = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="26" cy="28" r="11" fill="#2A2620" />
    <circle cx="74" cy="28" r="11" fill="#2A2620" />
    <ellipse cx="50" cy="58" rx="34" ry="32" fill="#FFFBF2" />
    <ellipse cx="38" cy="56" rx="8" ry="10" fill="#2A2620" transform="rotate(-15 38 56)" />
    <ellipse cx="62" cy="56" rx="8" ry="10" fill="#2A2620" transform="rotate(15 62 56)" />
    <circle cx="38" cy="56" r="3.2" fill="#FFFBF2" />
    <circle cx="62" cy="56" r="3.2" fill="#FFFBF2" />
    <ellipse cx="50" cy="68" rx="4" ry="3" fill="#2A2620" />
    <path d="M50 72 Q47 76 44 75 M50 72 Q53 76 56 75" stroke="#2A2620" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

const AvatarRabbit = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx="38" cy="22" rx="7" ry="18" fill="#E8DCC8" />
    <ellipse cx="62" cy="22" rx="7" ry="18" fill="#E8DCC8" />
    <ellipse cx="38" cy="22" rx="3.5" ry="13" fill="#E8A8B8" />
    <ellipse cx="62" cy="22" rx="3.5" ry="13" fill="#E8A8B8" />
    <ellipse cx="50" cy="60" rx="30" ry="28" fill="#F1E6D2" />
    <ellipse cx="40" cy="58" rx="3.2" ry="4.2" fill="#1F1A14" />
    <ellipse cx="60" cy="58" rx="3.2" ry="4.2" fill="#1F1A14" />
    <ellipse cx="50" cy="70" rx="3" ry="2.4" fill="#E8A8B8" />
    <path d="M50 72 Q47 78 44 76 M50 72 Q53 78 56 76" stroke="#1F1A14" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

const AvatarPenguin = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx="50" cy="54" rx="32" ry="36" fill="#2A2C3A" />
    <ellipse cx="50" cy="64" rx="18" ry="24" fill="#FFFBF2" />
    <circle cx="40" cy="48" r="3.2" fill="#FFFBF2" />
    <circle cx="60" cy="48" r="3.2" fill="#FFFBF2" />
    <circle cx="40" cy="49" r="1.8" fill="#1F1A14" />
    <circle cx="60" cy="49" r="1.8" fill="#1F1A14" />
    <polygon points="50,55 44,60 56,60" fill="#E8A05A" />
    <polygon points="50,60 46,64 54,64" fill="#D97757" />
  </svg>
);

const AvatarLion = () => (
  <svg viewBox="0 0 100 100">
    {/* mane: scalloped via overlapping circles */}
    <g fill="#C97A4A">
      <circle cx="22" cy="40" r="11" />
      <circle cx="30" cy="22" r="11" />
      <circle cx="50" cy="14" r="11" />
      <circle cx="70" cy="22" r="11" />
      <circle cx="78" cy="40" r="11" />
      <circle cx="80" cy="62" r="11" />
      <circle cx="62" cy="82" r="11" />
      <circle cx="38" cy="82" r="11" />
      <circle cx="20" cy="62" r="11" />
    </g>
    <circle cx="50" cy="52" r="26" fill="#EBB378" />
    <ellipse cx="42" cy="50" rx="3" ry="4" fill="#1F1A14" />
    <ellipse cx="58" cy="50" rx="3" ry="4" fill="#1F1A14" />
    <ellipse cx="50" cy="60" rx="3" ry="2.4" fill="#1F1A14" />
    <path d="M50 62 Q46 68 43 66 M50 62 Q54 68 57 66" stroke="#1F1A14" strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

const AvatarHedgehog = () => (
  <svg viewBox="0 0 100 100">
    {/* spiky dome — triangles around the top */}
    <g fill="#6E5240">
      <polygon points="16,52 22,28 30,52" />
      <polygon points="24,52 32,18 40,52" />
      <polygon points="34,52 42,12 50,52" />
      <polygon points="46,52 54,10 62,52" />
      <polygon points="58,52 66,12 74,52" />
      <polygon points="68,52 76,18 84,52" />
    </g>
    <path d="M10 52 Q50 52 90 52 Q90 76 50 88 Q10 76 10 52 Z" fill="#6E5240" />
    {/* face */}
    <ellipse cx="50" cy="70" rx="22" ry="18" fill="#E8CFAE" />
    <circle cx="50" cy="80" r="3.6" fill="#1F1A14" />
    <ellipse cx="40" cy="68" rx="2.4" ry="3" fill="#1F1A14" />
    <ellipse cx="60" cy="68" rx="2.4" ry="3" fill="#1F1A14" />
    {/* blush */}
    <circle cx="38" cy="76" r="3" fill="#E8A8B8" opacity="0.7" />
    <circle cx="62" cy="76" r="3" fill="#E8A8B8" opacity="0.7" />
  </svg>
);

const AvatarWhale = () => (
  <svg viewBox="0 0 100 100">
    {/* spout */}
    <ellipse cx="38" cy="20" rx="3" ry="6" fill="#8FB8D6" opacity="0.8" />
    <ellipse cx="34" cy="14" rx="2.4" ry="4" fill="#8FB8D6" opacity="0.6" />
    {/* body */}
    <path d="M16 60 Q16 36 44 32 Q72 28 84 50 Q92 60 84 68 L92 72 L84 78 Q72 86 44 82 Q16 80 16 60 Z" fill="#4B7CA3" />
    {/* underside */}
    <path d="M22 64 Q42 78 70 72 Q60 80 44 80 Q26 78 22 64 Z" fill="#C8DCEC" />
    <circle cx="60" cy="52" r="3.2" fill="#1F1A14" />
    <circle cx="61" cy="51" r="1.1" fill="#FFF" />
  </svg>
);

const AvatarDeer = () => (
  <svg viewBox="0 0 100 100">
    {/* antlers */}
    <g stroke="#7A5235" strokeWidth="2.8" strokeLinecap="round" fill="none">
      <path d="M32 30 L26 18 M32 30 L22 24 M32 30 L30 12" />
      <path d="M68 30 L74 18 M68 30 L78 24 M68 30 L70 12" />
    </g>
    <ellipse cx="50" cy="58" rx="30" ry="32" fill="#D2A578" />
    {/* ears */}
    <ellipse cx="22" cy="42" rx="6" ry="10" fill="#D2A578" transform="rotate(-30 22 42)" />
    <ellipse cx="78" cy="42" rx="6" ry="10" fill="#D2A578" transform="rotate(30 78 42)" />
    <ellipse cx="22" cy="42" rx="2.6" ry="6" fill="#E8A8B8" transform="rotate(-30 22 42)" />
    <ellipse cx="78" cy="42" rx="2.6" ry="6" fill="#E8A8B8" transform="rotate(30 78 42)" />
    {/* muzzle */}
    <ellipse cx="50" cy="68" rx="12" ry="10" fill="#F1E0C6" />
    <ellipse cx="40" cy="56" rx="3" ry="4" fill="#1F1A14" />
    <ellipse cx="60" cy="56" rx="3" ry="4" fill="#1F1A14" />
    <ellipse cx="50" cy="66" rx="2.6" ry="2" fill="#1F1A14" />
    {/* spots */}
    <circle cx="30" cy="62" r="1.6" fill="#F1E0C6" opacity="0.7" />
    <circle cx="34" cy="74" r="1.6" fill="#F1E0C6" opacity="0.7" />
    <circle cx="70" cy="62" r="1.6" fill="#F1E0C6" opacity="0.7" />
    <circle cx="66" cy="74" r="1.6" fill="#F1E0C6" opacity="0.7" />
  </svg>
);

const AVATAR_LIST = [
  { id: 0,  name: "Fox",      cmp: AvatarFox,      tint: "var(--butter-soft)" },
  { id: 1,  name: "Bear",     cmp: AvatarBear,     tint: "var(--accent-soft)" },
  { id: 2,  name: "Owl",      cmp: AvatarOwl,      tint: "var(--lilac-soft)" },
  { id: 3,  name: "Cat",      cmp: AvatarCat,      tint: "var(--card-2)" },
  { id: 4,  name: "Frog",     cmp: AvatarFrog,     tint: "var(--moss-soft)" },
  { id: 5,  name: "Panda",    cmp: AvatarPanda,    tint: "var(--card-2)" },
  { id: 6,  name: "Rabbit",   cmp: AvatarRabbit,   tint: "var(--berry-soft)" },
  { id: 7,  name: "Penguin",  cmp: AvatarPenguin,  tint: "var(--sky-soft)" },
  { id: 8,  name: "Lion",     cmp: AvatarLion,     tint: "var(--butter-soft)" },
  { id: 9,  name: "Hedgehog", cmp: AvatarHedgehog, tint: "var(--lilac-soft)" },
  { id: 10, name: "Whale",    cmp: AvatarWhale,    tint: "var(--sky-soft)" },
  { id: 11, name: "Deer",     cmp: AvatarDeer,     tint: "var(--moss-soft)" },
];

const AVATAR_BY_ID = Object.fromEntries(AVATAR_LIST.map(a => [a.id, a]));

function Avatar({ id, size = 124, ring = false }) {
  const a = AVATAR_BY_ID[id] || AVATAR_LIST[0];
  const Cmp = a.cmp;
  return (
    <div
      className="swatch"
      style={{
        width: size,
        height: size,
        background: a.tint,
        boxShadow: ring ? "0 0 0 4px var(--paper), 0 0 0 5px var(--border)" : "none",
      }}
    >
      <Cmp />
    </div>
  );
}

Object.assign(window, {
  Avatar,
  AVATAR_LIST,
  AVATAR_BY_ID,
});
