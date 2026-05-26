// Redirect-back banner shown on /signin and /profiles when a kid PWA sent the
// user here with ?reason=. Copy is from the brief / design handoff.

export type RedirectReason = "locked" | "expired" | "unauthenticated";

interface BannerSpec {
  icon: string;
  text: string;
  tone: "info" | "";
}

const BANNERS: Record<RedirectReason, BannerSpec> = {
  locked: {
    icon: "🔒",
    text: "This app needs a subscription. Sign in to manage your account.",
    tone: "",
  },
  expired: { icon: "⏳", text: "Your session expired. Sign in again.", tone: "" },
  unauthenticated: { icon: "👋", text: "Please sign in to continue.", tone: "info" },
};

export function bannerSpecFor(reason: string | null): BannerSpec | null {
  if (reason && reason in BANNERS) return BANNERS[reason as RedirectReason];
  return null;
}

export function Banner({ reason }: { reason: string | null }) {
  const spec = bannerSpecFor(reason);
  if (!spec) return null;
  return (
    <div className={`banner ${spec.tone}`} role="status">
      <span style={{ fontSize: 18 }}>{spec.icon}</span>
      <span>{spec.text}</span>
    </div>
  );
}
