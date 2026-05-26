import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useToast } from "../components/ToastProvider";
import { listProfilesApi, type ProfileRow } from "../lib/api";
import { APPS } from "../lib/apps";
import { Avatar } from "../lib/avatars";
import { AddProfileModal, type NewProfile } from "../components/AddProfileModal";
import { IconArrowLeft, IconChevron, IconLock, IconPlus, IconSignOut, Wordmark } from "../components/icons";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
  unpaid: "Unpaid",
  none: "None",
};
const STATUS_DOT: Record<string, "live" | "warn" | "off"> = {
  trialing: "live",
  active: "live",
  past_due: "warn",
  cancelled: "off",
  unpaid: "warn",
  none: "off",
};
const AGE_LABEL: Record<string, string> = { under_5: "Under 5", "5_7": "5–7", "8_10": "8–10" };

function fmtDate(unix: number | null | undefined): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ParentDashboard() {
  const { session, signOut, createProfile } = useSession();
  const navigate = useNavigate();
  const showToast = useToast();
  const [adding, setAdding] = useState(false);
  const [rows, setRows] = useState<ProfileRow[] | null>(null);

  // /me's parent profiles carry only id/name/avatar; GET /profiles adds
  // age_band + created_at for the richer dashboard rows.
  const loadRows = useCallback(() => {
    listProfilesApi()
      .then((r) => setRows(r.profiles))
      .catch(() => setRows([]));
  }, []);
  useEffect(loadRows, [loadRows]);

  if (!session?.authenticated || session.mode !== "parent") return null;
  const { subscription, parent, family, co_parents, entitlements } = session;

  const planLabel =
    subscription.plan === "annual" ? "Annual" : subscription.plan === "monthly" ? "Monthly" : "—";
  const statusLabel = STATUS_LABEL[subscription.status] ?? "—";
  const statusDot = STATUS_DOT[subscription.status] ?? "off";

  // Prefer the richer fetched rows; fall back to the session's basic profiles.
  const profiles: Array<{ id: string; display_name: string; avatar_id: number; age_band?: string | null; created_at?: number }> =
    rows ?? session.profiles;

  async function onSignOut() {
    await signOut();
    navigate("/signin");
  }

  async function onCreate(body: NewProfile) {
    await createProfile(body);
    setAdding(false);
    showToast(`${body.display_name} joined.`);
    loadRows();
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/profiles")}>
            <IconArrowLeft /> Profiles
          </button>
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          <Wordmark size={22} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {parent.email}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
            <IconSignOut /> Sign out
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <div className="mt-4 mb-8">
          <div className="eyebrow">
            <span className="dot live" /> Grown-up area
          </div>
          <h1 style={{ fontSize: 52, marginTop: 8 }}>
            The <em style={{ fontStyle: "italic" }}>{family.display_name || "family"}</em> account.
          </h1>
          <p className="muted" style={{ marginTop: 10, fontSize: 17 }}>
            Subscription, profiles, and quiet controls. Sensitive changes will ask for a fresh email link.
          </p>
        </div>

        <div className="dash-grid">
          {/* LEFT COLUMN */}
          <div className="stack gap-5">
            {/* Subscription card */}
            <div className="card" style={{ padding: 28 }}>
              <div className="row-h" style={{ justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div className="eyebrow">Subscription</div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span className="display" style={{ fontSize: 34 }}>
                      {planLabel}
                    </span>
                    <span className={`chip ${statusDot === "live" ? "moss" : statusDot === "warn" ? "accent" : ""}`}>
                      <span className={`dot ${statusDot}`} /> {statusLabel}
                    </span>
                  </div>
                </div>
                {subscription.status === "trialing" && (
                  <button className="btn btn-accent" onClick={() => showToast("Checkout is coming soon.")}>
                    Upgrade to paid
                  </button>
                )}
                {subscription.status === "active" && (
                  <button className="btn btn-secondary" onClick={() => showToast("Billing portal coming soon.")}>
                    Manage billing
                  </button>
                )}
                {(subscription.status === "none" ||
                  subscription.status === "cancelled" ||
                  subscription.status === "unpaid" ||
                  subscription.status === "past_due") && (
                  <button className="btn btn-accent" onClick={() => showToast("Checkout is coming soon.")}>
                    Start subscription
                  </button>
                )}
              </div>

              <div className="row-h" style={{ gap: 28 }}>
                <Metric label="Renews" value={fmtDate(subscription.current_period_end)} />
                <Metric label="Apps unlocked" value={`${entitlements.apps_unlocked.length} of ${APPS.length}`} />
                <Metric
                  label="Co-parents"
                  value={co_parents.length ? `${co_parents.length} invited` : "Add one (free)"}
                />
              </div>
            </div>

            {/* Profiles list */}
            <div className="card">
              <div className="row-h" style={{ justifyContent: "space-between", padding: "20px 24px 12px" }}>
                <div className="eyebrow">Kid profiles</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
                  <IconPlus /> Add a profile
                </button>
              </div>
              <div>
                {profiles.length === 0 ? (
                  <div className="muted" style={{ padding: "12px 24px 28px", textAlign: "center" }}>
                    No profiles yet. Add one so the kids have somewhere to land.
                  </div>
                ) : (
                  profiles.map((p) => (
                    <div key={p.id} className="row" style={{ padding: "14px 24px" }}>
                      <Avatar id={p.avatar_id} size={44} />
                      <div className="stack" style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.display_name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.age_band ? `Age ${AGE_LABEL[p.age_band] ?? p.age_band}` : "Age not set"}
                          {p.created_at ? ` · Added ${fmtDate(p.created_at)}` : ""}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => showToast("Profile edit coming soon.")}>
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* In the bundle */}
            <div className="card" style={{ padding: 24 }}>
              <div className="row-h" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                <div className="eyebrow">In the bundle</div>
                <span className="muted" style={{ fontSize: 13 }}>
                  One subscription, every app.
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {APPS.map((app) => (
                  <div key={app.slug} className="row-h gap-3" style={{ padding: 10, borderRadius: 14, background: "var(--card-2)" }}>
                    <div className="app-icon" style={{ width: 40, height: 40, borderRadius: 12, background: app.bg, color: app.color }}>
                      <app.icon />
                    </div>
                    <div className="stack" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{app.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {app.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="stack gap-5">
            <div className="card kpi">
              <span className="label">Plan</span>
              <span className="value">
                $11.50<span style={{ fontSize: 16, color: "var(--ink-3)" }}> /mo</span>
              </span>
              <span className="sub">Billed monthly in AUD. Annual save ~30%.</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showToast("Switch to annual — soon.");
                }}
                style={{ marginTop: 8, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}
              >
                Switch to annual →
              </a>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow mb-2">Mr Know-it-all usage</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span className="display" style={{ fontSize: 36 }}>
                  34
                </span>
                <span className="muted">of 200 voice turns this month</span>
              </div>
              <div style={{ height: 6, background: "var(--card-2)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: "17%", height: "100%", background: "var(--accent)", borderRadius: 999 }} />
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Hard quota. No bill shock. Resets {fmtDate(subscription.current_period_end)}.
              </p>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow mb-2">Account</div>
              <div className="stack gap-3" style={{ marginTop: 10 }}>
                <AccountRow label="Invite a co-parent" trailing={<span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>Free <IconChevron /></span>} onClick={() => showToast("Co-parent invites — soon.")} />
                <AccountRow label="Change parent email" trailing={<span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconLock s={12} /> Sensitive</span>} onClick={() => showToast("Email change requires a sign-in link.")} />
                <AccountRow label="Export my data" trailing={<IconChevron />} onClick={() => showToast("Data export — soon.")} />
                <AccountRow label="Cancel subscription" labelColor="var(--accent)" trailing={<span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconLock s={12} /> Sensitive</span>} onClick={() => showToast("Cancellation requires a sign-in link.")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {adding && (
        <AddProfileModal
          onClose={() => setAdding(false)}
          onCreate={onCreate}
          usedAvatarIds={profiles.map((p) => p.avatar_id)}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stack gap-2">
      <span className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function AccountRow({
  label,
  trailing,
  onClick,
  labelColor,
}: {
  label: string;
  trailing: React.ReactNode;
  onClick: () => void;
  labelColor?: string;
}) {
  return (
    <button
      className="row-h"
      style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "transparent" }}
      onClick={onClick}
    >
      <span style={{ fontWeight: 500, color: labelColor }}>{label}</span>
      {trailing}
    </button>
  );
}
