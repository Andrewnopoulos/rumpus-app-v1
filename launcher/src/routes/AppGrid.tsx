import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { KidProfile } from "@rumpusroom/auth-client";
import { useSession } from "../auth/useSession";
import { APPS, resolveLaunchUrl, type AppEntry } from "../lib/apps";
import { Avatar } from "../lib/avatars";
import { SwitchProfileModal } from "../components/SwitchProfileModal";
import { IconArrowRight, Wordmark } from "../components/icons";

export function AppGrid() {
  const { session, deselectProfile } = useSession();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  // RequireKid guarantees kid mode here.
  const profile: KidProfile | null =
    session?.authenticated && session.mode === "kid" ? session.profile : null;
  const unlocked = session?.authenticated ? session.entitlements.apps_unlocked : [];
  const apps: AppEntry[] = APPS.filter((a) => unlocked.includes(a.slug));

  function launch(app: AppEntry) {
    window.location.assign(resolveLaunchUrl(app.launchUrl));
  }

  async function confirmAdult() {
    await deselectProfile();
    navigate("/profiles");
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <button className="switch-btn" onClick={() => setSwitching(true)}>
          <span className="mini" style={{ background: "var(--card-2)" }}>
            {profile && <Avatar id={profile.avatar_id} size={28} />}
          </span>
          Not {profile?.display_name}?
        </button>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <div className="kid-greet mt-6 mb-8">
          {profile && <Avatar id={profile.avatar_id} size={104} />}
          <div>
            <h1 style={{ fontSize: 72, lineHeight: 1.15 }}>
              Hi, <em style={{ fontStyle: "italic" }}>{profile?.display_name}!</em>
            </h1>
            <p className="muted" style={{ marginTop: 8, fontSize: 17 }}>
              Pick something to play. You have {apps.length} app{apps.length === 1 ? "" : "s"} ready.
            </p>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
            <h3>No apps yet</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Ask a grown-up to turn on your subscription.
            </p>
          </div>
        ) : (
          <div className="grid-apps">
            {apps.map((app) => (
              <button key={app.slug} className="app-tile" onClick={() => launch(app)}>
                <div className="app-icon" style={{ background: app.bg, color: app.color }}>
                  <app.icon />
                </div>
                <div>
                  <div className="app-name">{app.name}</div>
                  <div className="app-desc">{app.desc}</div>
                </div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, fontWeight: 600 }}>
                  Open <IconArrowRight />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {switching && (
        <SwitchProfileModal profile={profile} onClose={() => setSwitching(false)} onConfirmAdult={confirmAdult} />
      )}
    </div>
  );
}
