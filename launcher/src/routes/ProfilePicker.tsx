import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { KidProfile } from "@rumpusroom/auth-client";
import { useSession } from "../auth/useSession";
import { useToast } from "../components/ToastProvider";
import { Avatar } from "../lib/avatars";
import { Banner } from "../components/Banner";
import { AddProfileModal, type NewProfile } from "../components/AddProfileModal";
import { IconPlus, IconSignOut, Wordmark } from "../components/icons";

export function ProfilePicker() {
  const { session, selectProfile, signOut, createProfile } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showToast = useToast();
  const [adding, setAdding] = useState(false);

  // RequireParent guarantees parent mode here.
  const profiles: KidProfile[] = session?.authenticated && session.mode === "parent" ? session.profiles : [];
  const usedAvatarIds = profiles.map((p) => p.avatar_id);
  const empty = profiles.length === 0;

  async function pick(id: string) {
    await selectProfile(id);
    navigate("/apps");
  }

  async function onSignOut() {
    await signOut();
    navigate("/signin");
  }

  async function onCreate(body: NewProfile) {
    await createProfile(body); // throws on failure → modal surfaces it
    setAdding(false);
    showToast(`${body.display_name} joined.`);
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
          <IconSignOut /> Sign out
        </button>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <Banner reason={params.get("reason")} />

        <div className="center mt-6 mb-8">
          <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 14 }}>
            <span className="dot live" /> You're signed in
          </div>
          <h1 style={{ fontSize: 60 }}>
            Who's playing <em style={{ fontStyle: "italic" }}>today?</em>
          </h1>
          <p className="muted" style={{ marginTop: 14, fontSize: 17 }}>
            Tap a face to hand the tablet over. The grown-up tile stays for you.
          </p>
        </div>

        {empty ? (
          <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <h3>Add your first kid</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Choose a name and an animal. That's all. No birthdays, no photos.
            </p>
            <button className="btn btn-primary mt-6" onClick={() => setAdding(true)}>
              <IconPlus /> Add a profile
            </button>
          </div>
        ) : (
          <div className="grid-profiles" style={{ maxWidth: 880, margin: "0 auto" }}>
            {profiles.map((p) => (
              <button key={p.id} className="tile" onClick={() => pick(p.id)}>
                <Avatar id={p.avatar_id} />
                <div className="tile-name">{p.display_name}</div>
              </button>
            ))}
            <button className="tile" onClick={() => setAdding(true)} style={{ borderStyle: "dashed", background: "transparent" }}>
              <div className="swatch" style={{ background: "var(--card-2)" }}>
                <div style={{ color: "var(--ink-3)" }}>
                  <IconPlus s={36} />
                </div>
              </div>
              <div className="tile-name muted">Add a profile</div>
            </button>
            <button className="tile" onClick={() => navigate("/dashboard")}>
              <div className="swatch" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                <svg viewBox="0 0 64 64" style={{ width: "55%", height: "55%" }}>
                  <circle cx="32" cy="24" r="10" fill="currentColor" />
                  <path d="M12 54c4-10 12-15 20-15s16 5 20 15" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="tile-name">Grown-ups</div>
              <div className="tile-sub">Subscription &amp; profiles</div>
            </button>
          </div>
        )}
      </div>

      {adding && (
        <AddProfileModal onClose={() => setAdding(false)} onCreate={onCreate} usedAvatarIds={usedAvatarIds} />
      )}
    </div>
  );
}
