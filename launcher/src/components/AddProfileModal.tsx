// Add-profile modal. Triggered from the picker's "Add a profile" tile and the
// dashboard's "+ Add a profile" button. Owns its own form state; the parent
// supplies onCreate (which talks to the API and may throw an ApiError).

import { useState } from "react";
import { Avatar, AVATAR_BY_ID, AVATAR_LIST } from "../lib/avatars";
import { IconCheck } from "./icons";
import { ApiError } from "../lib/api";

const AGE_BANDS = [
  { v: "under_5", l: "Under 5" },
  { v: "5_7", l: "5–7" },
  { v: "8_10", l: "8–10" },
];

export interface NewProfile {
  display_name: string;
  avatar_id: number;
  age_band: string | null;
}

export function AddProfileModal({
  onClose,
  onCreate,
  usedAvatarIds,
}: {
  onClose: () => void;
  onCreate: (body: NewProfile) => Promise<void>;
  usedAvatarIds: number[];
}) {
  const firstFree = AVATAR_LIST.find((a) => !usedAvatarIds.includes(a.id)) ?? AVATAR_LIST[0];
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(firstFree.id);
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await onCreate({ display_name: name.trim(), avatar_id: avatarId, age_band: age || null });
      // On success the parent unmounts this modal.
    } catch (err) {
      if (err instanceof ApiError && err.code === "avatar_taken") {
        const suggested = (err.body as { suggested_avatar_id?: number } | undefined)
          ?.suggested_avatar_id;
        if (typeof suggested === "number") setAvatarId(suggested);
        setError("That animal is taken — we picked the next free one.");
      } else {
        setError(err instanceof Error ? err.message : "Could not add the profile.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="row-h" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div className="eyebrow">New profile</div>
            <h2 className="display" style={{ marginTop: 6, fontSize: 32 }}>
              Who's joining?
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
          A first name and an animal is all we need. You can change either later.
        </p>

        <form onSubmit={submit} className="stack gap-5">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24, alignItems: "center" }}>
            <div className="stack gap-2">
              <label className="field-label" htmlFor="kidname">
                Name
              </label>
              <input
                id="kidname"
                className="field"
                placeholder="Emma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoFocus
              />

              <div className="field-label" style={{ marginTop: 16 }}>
                Age band <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AGE_BANDS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={"chip" + (age === o.v ? " accent" : "")}
                    style={{ padding: "8px 14px", cursor: "pointer", border: "0.5px solid var(--border)" }}
                    onClick={() => setAge(age === o.v ? "" : o.v)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", placeItems: "center" }}>
              <Avatar id={avatarId} size={160} ring />
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                {AVATAR_BY_ID[avatarId]?.name}
              </div>
            </div>
          </div>

          <div>
            <div className="field-label mb-2">Choose an animal</div>
            <div className="avatar-pick">
              {AVATAR_LIST.map((a) => {
                const disabled = usedAvatarIds.includes(a.id) && a.id !== avatarId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={avatarId === a.id}
                    aria-label={a.name}
                    disabled={disabled}
                    style={{
                      background: a.tint,
                      opacity: disabled ? 0.3 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                    onClick={() => setAvatarId(a.id)}
                  >
                    <a.cmp />
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: "var(--accent)" }}>{error}</div>}

          <div className="row-h" style={{ justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || busy}>
              <IconCheck /> {busy ? "Adding…" : `Add ${name.trim() || "profile"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
