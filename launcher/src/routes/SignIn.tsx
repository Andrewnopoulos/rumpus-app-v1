import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { ApiError } from "../lib/api";
import { Banner } from "../components/Banner";
import { IconArrowRight, IconCheck, Wordmark } from "../components/icons";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function SignIn() {
  const { requestMagicLink } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason");

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await requestMagicLink(email.trim().toLowerCase());
      navigate("/signin/sent", { state: { email: email.trim().toLowerCase() } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many tries. Please wait a few minutes and try again.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <a className="btn btn-ghost btn-sm" href="#" onClick={(e) => e.preventDefault()}>
          About
        </a>
      </div>

      <div className="container" style={{ display: "grid", placeItems: "center", flex: 1, paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <Banner reason={reason} />

          <div className="center" style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>
              <span className="dot live" /> Welcome home
            </div>
            <h1 style={{ fontSize: 64 }}>
              Step into the <em style={{ fontStyle: "italic" }}>rumpus&nbsp;room</em>.
            </h1>
            <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
              One quiet account for the grown-ups. A safe play space for the kids.
            </p>
          </div>

          <form onSubmit={submit} className="card" style={{ padding: 24 }} noValidate>
            <label className="field-label" htmlFor="email">
              Parent email
            </label>
            <input
              id="email"
              type="email"
              className="field"
              placeholder="hello@home.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              style={{ marginTop: 8 }}
            />
            {error && <div style={{ fontSize: 13, color: "var(--accent)", marginTop: 8 }}>{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 16 }} disabled={busy}>
              {busy ? "Sending…" : "Send sign-in link"} <IconArrowRight />
            </button>
            <p className="muted" style={{ fontSize: 13, marginTop: 14, textAlign: "center" }}>
              We'll email you a one-time link. No passwords to remember.
            </p>
          </form>

          <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 28, flexWrap: "wrap" }}>
            <span className="chip">
              <IconCheck s={12} /> No ads, ever
            </span>
            <span className="chip">
              <IconCheck s={12} /> No data on kids
            </span>
            <span className="chip">
              <IconCheck s={12} /> Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
