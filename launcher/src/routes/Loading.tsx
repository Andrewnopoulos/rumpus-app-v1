import { Wordmark } from "../components/icons";

/** Initial-load state while the first /me fetch resolves. */
export function Loading() {
  return (
    <div className="shell shell-bg" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: 0.7 }}>
        <Wordmark size={28} />
        <div className="muted" style={{ fontSize: 13 }}>
          Loading…
        </div>
      </div>
    </div>
  );
}
