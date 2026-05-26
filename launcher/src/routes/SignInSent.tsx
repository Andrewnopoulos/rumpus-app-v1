import { useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "../components/icons";

// "Check your email" confirmation. Production has only "Use a different email" —
// the real flow returns via /auth/consume on the API, not a fake button.
export function SignInSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
      </div>
      <div className="container" style={{ display: "grid", placeItems: "center", flex: 1, paddingBottom: 64 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div className="swatch" style={{ width: 120, height: 120, background: "var(--moss-soft)", margin: "0 auto 24px" }}>
            <svg viewBox="0 0 64 64" style={{ width: "55%", height: "55%", color: "var(--moss)" }}>
              <rect x="6" y="14" width="52" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M6 16 L32 36 L58 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="14" r="8" fill="var(--moss)" />
              <path d="M46 14 L49 17 L54 11" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 style={{ fontSize: 52 }}>Check your email.</h1>
          <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
            We sent a sign-in link to <strong style={{ color: "var(--ink)" }}>{email || "your inbox"}</strong>. It's good
            for 15 minutes.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/signin")}>
              Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
