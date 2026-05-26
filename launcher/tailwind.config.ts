import type { Config } from "tailwindcss";

// Colours reference the oklch CSS variables defined in styles.css so the
// four palettes stay a one-attribute swap (`<html data-palette="...">`).
// Tailwind utilities are available for incidental layout; the locked
// component styling lives in the design's own classes (see styles.css).
const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        "paper-2": token("paper-2"),
        card: token("card"),
        "card-2": token("card-2"),
        ink: token("ink"),
        "ink-2": token("ink-2"),
        "ink-3": token("ink-3"),
        border: token("border"),
        "border-2": token("border-2"),
        accent: token("accent"),
        "accent-soft": token("accent-soft"),
        moss: token("moss"),
        "moss-soft": token("moss-soft"),
        sky: token("sky"),
        "sky-soft": token("sky-soft"),
        butter: token("butter"),
        "butter-soft": token("butter-soft"),
        berry: token("berry"),
        "berry-soft": token("berry-soft"),
        lilac: token("lilac"),
        "lilac-soft": token("lilac-soft"),
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-ui)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        pill: "var(--r-pill)",
      },
    },
  },
  plugins: [],
} satisfies Config;
