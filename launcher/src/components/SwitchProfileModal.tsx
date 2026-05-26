// Switch-profile modal (kid mode). The "ask a grown-up" gate before leaving
// kid mode. "I'm the grown-up" calls deselect (→ parent mode) and routes to
// the profile picker.

import { useState } from "react";
import type { KidProfile } from "@rumpusroom/auth-client";

export function SwitchProfileModal({
  profile,
  onClose,
  onConfirmAdult,
}: {
  profile: KidProfile | null;
  onClose: () => void;
  onConfirmAdult: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirmAdult();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center" }}>
          <div className="swatch" style={{ width: 96, height: 96, background: "var(--accent-soft)", margin: "0 auto 16px" }}>
            <svg viewBox="0 0 64 64" style={{ width: "55%", height: "55%", color: "var(--accent)" }}>
              <path d="M32 6 L58 54 H6 Z" stroke="currentColor" strokeWidth="4" fill="none" strokeLinejoin="round" />
              <line x1="32" y1="22" x2="32" y2="38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <circle cx="32" cy="46" r="2.4" fill="currentColor" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 32 }}>
            Ask a grown-up.
          </h2>
          <p className="muted" style={{ marginTop: 10 }}>
            Swapping profiles needs a grown-up tap. {profile?.display_name}, hand the tablet over for a sec.
          </p>
          <div className="row-h" style={{ justifyContent: "center", gap: 10, marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Keep playing
            </button>
            <button className="btn btn-primary" onClick={confirm} disabled={busy} type="button">
              {busy ? "One sec…" : "I'm the grown-up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
