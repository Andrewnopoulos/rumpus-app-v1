import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { APP_BY_SLUG } from "../lib/apps";
import { IconArrowRight, Wordmark } from "../components/icons";

const REASONS: Record<string, { title: string; sub: string; icon: string }> = {
  locked: {
    title: "This one needs a subscription.",
    sub: "Looks like the bundle is paused. Pop back to your account to turn it on.",
    icon: "🔒",
  },
  expired: {
    title: "You've been away a while.",
    sub: "We logged you out for safety. Sign in to pick up where you left off.",
    icon: "⏳",
  },
  unauthenticated: {
    title: "Sign in to keep playing.",
    sub: "You'll just need the parent email.",
    icon: "👋",
  },
};

// Dedicated landing for kid-PWA redirects (?from=slug&reason=...). Doesn't
// auto-redirect — the user sees why they're back, then chooses.
export function Locked() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [params] = useSearchParams();
  const reason = params.get("reason") ?? "locked";
  const from = params.get("from") ?? "";
  const r = REASONS[reason] ?? REASONS.locked;
  const fromApp = APP_BY_SLUG[from];
  const signedIn = !!session?.authenticated;

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
      </div>
      <div className="container" style={{ display: "grid", placeItems: "center", flex: 1, paddingBottom: 64 }}>
        <div className="card" style={{ padding: 36, maxWidth: 520, width: "100%", textAlign: "center" }}>
          {fromApp && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 12px 6px 6px", background: "var(--card-2)", borderRadius: 999, marginBottom: 20 }}>
              <span className="app-icon" style={{ width: 28, height: 28, borderRadius: 8, background: fromApp.bg, color: fromApp.color }}>
                <fromApp.icon />
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>From {fromApp.name}</span>
            </div>
          )}
          <div style={{ fontSize: 44 }}>{r.icon}</div>
          <h2 className="display" style={{ fontSize: 36, marginTop: 8 }}>
            {r.title}
          </h2>
          <p className="muted" style={{ marginTop: 12, fontSize: 16 }}>
            {r.sub}
          </p>
          <div className="row-h" style={{ justifyContent: "center", gap: 10, marginTop: 24 }}>
            {signedIn ? (
              <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
                Open my account <IconArrowRight />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate("/signin")}>
                Sign in <IconArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
