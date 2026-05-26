// launcher/screens.jsx
// All routes for the RumpusRoom launcher prototype.
// Navigation is via the `route` state in app.jsx — these are pure-ish screen components.

// ---------- Loading ----------
function LoadingScreen() {
  return (
    <div className="shell shell-bg" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: 0.7 }}>
        <Wordmark size={28} />
        <div className="muted" style={{ fontSize: 13 }}>Loading…</div>
      </div>
    </div>
  );
}

// ---------- Sign-in ----------
function SignInScreen({ banner, onSent }) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  function submit(e) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setError("");
    setBusy(true);
    setTimeout(() => { setBusy(false); onSent(email); }, 650);
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <a className="btn btn-ghost btn-sm" href="#" onClick={(e) => e.preventDefault()}>About</a>
      </div>

      <div className="container" style={{ display: "grid", placeItems: "center", flex: 1, paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {banner && (
            <div className={`banner ${banner.tone || ""}`} role="status">
              <span style={{ fontSize: 18 }}>{banner.icon}</span>
              <span>{banner.text}</span>
            </div>
          )}

          <div className="center" style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>
              <span className="dot live" /> Welcome home
            </div>
            <h1 style={{ fontSize: 64 }}>Step into the <em style={{ fontStyle: "italic" }}>rumpus&nbsp;room</em>.</h1>
            <p className="muted" style={{ marginTop: 16, fontSize: 17 }}>
              One quiet account for the grown-ups. A safe play space for the kids.
            </p>
          </div>

          <form onSubmit={submit} className="card" style={{ padding: 24 }}>
            <label className="field-label" htmlFor="email">Parent email</label>
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
            <span className="chip"><IconCheck s={12} /> No ads, ever</span>
            <span className="chip"><IconCheck s={12} /> No data on kids</span>
            <span className="chip"><IconCheck s={12} /> Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sign-in sent ----------
function SignInSentScreen({ email, onBack, onDemoConsume }) {
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
            We sent a sign-in link to <strong style={{ color: "var(--ink)" }}>{email || "your inbox"}</strong>.
            It's good for 15 minutes.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <button className="btn btn-secondary" onClick={onBack}>Use a different email</button>
            <button className="btn btn-primary" onClick={onDemoConsume}>
              I clicked the link <IconArrowRight />
            </button>
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 32 }}>
            Tip: this is a prototype — the "I clicked the link" button simulates the consume step.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Profile picker ----------
function ProfilePickerScreen({ profiles, onPickProfile, onParentDash, onAddProfile, onSignOut, banner }) {
  const empty = profiles.length === 0;
  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
            <IconSignOut /> Sign out
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        {banner && (
          <div className={`banner ${banner.tone || ""}`}>
            <span style={{ fontSize: 18 }}>{banner.icon}</span>
            <span>{banner.text}</span>
          </div>
        )}

        <div className="center mt-6 mb-8">
          <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 14 }}>
            <span className="dot live" /> You're signed in
          </div>
          <h1 style={{ fontSize: 60 }}>Who's playing <em style={{ fontStyle: "italic" }}>today?</em></h1>
          <p className="muted" style={{ marginTop: 14, fontSize: 17 }}>Tap a face to hand the tablet over. The grown-up tile stays for you.</p>
        </div>

        {empty ? (
          <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <h3>Add your first kid</h3>
            <p className="muted" style={{ marginTop: 8 }}>Choose a name and an animal. That's all. No birthdays, no photos.</p>
            <button className="btn btn-primary mt-6" onClick={onAddProfile}>
              <IconPlus /> Add a profile
            </button>
          </div>
        ) : (
          <div className="grid-profiles" style={{ maxWidth: 880, margin: "0 auto" }}>
            {profiles.map(p => (
              <button key={p.id} className="tile" onClick={() => onPickProfile(p.id)}>
                <Avatar id={p.avatar_id} />
                <div className="tile-name">{p.display_name}</div>
              </button>
            ))}
            <button className="tile" onClick={onAddProfile} style={{ borderStyle: "dashed", background: "transparent" }}>
              <div className="swatch" style={{ background: "var(--card-2)" }}>
                <div style={{ color: "var(--ink-3)" }}>
                  <IconPlus s={36} />
                </div>
              </div>
              <div className="tile-name muted">Add a profile</div>
            </button>
            <button className="tile" onClick={onParentDash}>
              <div className="swatch" style={{ background: "var(--ink)", color: "var(--paper)" }}>
                <svg viewBox="0 0 64 64" style={{ width: "55%", height: "55%" }}>
                  <circle cx="32" cy="24" r="10" fill="currentColor" />
                  <path d="M12 54c4-10 12-15 20-15s16 5 20 15" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="tile-name">Grown-ups</div>
              <div className="tile-sub">Subscription & profiles</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- App grid (kid mode) ----------
function AppGridScreen({ profile, apps, onLaunchApp, onSwitchProfile }) {
  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <Wordmark />
        <button className="switch-btn" onClick={onSwitchProfile}>
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
            <p className="muted" style={{ marginTop: 8 }}>Ask a grown-up to turn on your subscription.</p>
          </div>
        ) : (
          <div className="grid-apps">
            {apps.map(app => (
              <button key={app.slug} className="app-tile" onClick={() => onLaunchApp(app)}>
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
    </div>
  );
}

// ---------- Parent dashboard ----------
function ParentDashboardScreen({ session, onAddProfile, onSignOut, onBack, onToast }) {
  const { subscription, profiles, parent, family } = session;

  const planLabel = subscription.plan === "annual" ? "Annual" : subscription.plan === "monthly" ? "Monthly" : "—";
  const statusLabel = ({
    trialing: "Trial",
    active: "Active",
    past_due: "Past due",
    cancelled: "Cancelled",
    unpaid: "Unpaid",
    none: "None",
  })[subscription.status] || "—";
  const statusDot = ({
    trialing: "live", active: "live", past_due: "warn", cancelled: "off", unpaid: "warn", none: "off",
  })[subscription.status] || "off";

  function fmt(unix) {
    if (!unix) return "—";
    return new Date(unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="shell shell-bg">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <IconArrowLeft /> Profiles
          </button>
          <span style={{ width: 1, height: 22, background: "var(--border)" }} />
          <Wordmark size={22} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted" style={{ fontSize: 13 }}>{parent.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}><IconSignOut /> Sign out</button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <div className="mt-4 mb-8">
          <div className="eyebrow"><span className="dot live" /> Grown-up area</div>
          <h1 style={{ fontSize: 52, marginTop: 8 }}>The <em style={{ fontStyle: "italic" }}>{family.display_name || "family"}</em> account.</h1>
          <p className="muted" style={{ marginTop: 10, fontSize: 17 }}>Subscription, profiles, and quiet controls. Sensitive changes will ask for a fresh email link.</p>
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
                    <span className="display" style={{ fontSize: 34 }}>{planLabel}</span>
                    <span className={`chip ${statusDot === "live" ? "moss" : statusDot === "warn" ? "accent" : ""}`}>
                      <span className={`dot ${statusDot}`} /> {statusLabel}
                    </span>
                  </div>
                </div>
                {subscription.status === "trialing" && (
                  <button className="btn btn-accent">Upgrade to paid</button>
                )}
                {subscription.status === "active" && (
                  <button className="btn btn-secondary" onClick={() => onToast("Billing portal coming soon.")}>Manage billing</button>
                )}
                {subscription.status === "none" && (
                  <button className="btn btn-accent">Start subscription</button>
                )}
              </div>

              <div className="row-h" style={{ gap: 28 }}>
                <div className="stack gap-2">
                  <span className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Renews</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{fmt(subscription.current_period_end)}</span>
                </div>
                <div className="stack gap-2">
                  <span className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Apps unlocked</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{APPS.length} of {APPS.length}</span>
                </div>
                <div className="stack gap-2">
                  <span className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Co-parents</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{session.co_parents?.length ? `${session.co_parents.length} invited` : "Add one (free)"}</span>
                </div>
              </div>
            </div>

            {/* Profiles list */}
            <div className="card">
              <div className="row-h" style={{ justifyContent: "space-between", padding: "20px 24px 12px" }}>
                <div className="eyebrow">Kid profiles</div>
                <button className="btn btn-secondary btn-sm" onClick={onAddProfile}>
                  <IconPlus /> Add a profile
                </button>
              </div>
              <div>
                {profiles.length === 0 ? (
                  <div className="muted" style={{ padding: "12px 24px 28px", textAlign: "center" }}>
                    No profiles yet. Add one so the kids have somewhere to land.
                  </div>
                ) : profiles.map((p) => (
                  <div key={p.id} className="row" style={{ padding: "14px 24px" }}>
                    <Avatar id={p.avatar_id} size={44} />
                    <div className="stack" style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{p.display_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.age_band ? `Age ${p.age_band.replace("_", "–")}` : "Age not set"} • Added {fmt(p.created_at)}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => onToast("Profile edit coming soon.")}>Edit</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Apps unlocked summary */}
            <div className="card" style={{ padding: 24 }}>
              <div className="row-h" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                <div className="eyebrow">In the bundle</div>
                <span className="muted" style={{ fontSize: 13 }}>One subscription, every app.</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {APPS.map(app => (
                  <div key={app.slug} className="row-h gap-3"
                       style={{ padding: 10, borderRadius: 14, background: "var(--card-2)" }}>
                    <div className="app-icon" style={{ width: 40, height: 40, borderRadius: 12, background: app.bg, color: app.color }}>
                      <app.icon />
                    </div>
                    <div className="stack" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{app.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{app.desc}</div>
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
              <span className="value">$11.50<span style={{ fontSize: 16, color: "var(--ink-3)" }}> /mo</span></span>
              <span className="sub">Billed monthly in AUD. Annual save ~30%.</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onToast("Switch to annual — soon."); }} style={{ marginTop: 8, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Switch to annual →</a>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow mb-2">Mr Know-it-all usage</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span className="display" style={{ fontSize: 36 }}>34</span>
                <span className="muted">of 200 voice turns this month</span>
              </div>
              <div style={{ height: 6, background: "var(--card-2)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: "17%", height: "100%", background: "var(--accent)", borderRadius: 999 }} />
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Hard quota. No bill shock. Resets {fmt(subscription.current_period_end)}.
              </p>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow mb-2">Account</div>
              <div className="stack gap-3" style={{ marginTop: 10 }}>
                <button className="row-h" style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "transparent" }} onClick={() => onToast("Co-parent invites — soon.")}>
                  <span style={{ fontWeight: 500 }}>Invite a co-parent</span>
                  <span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>Free <IconChevron /></span>
                </button>
                <button className="row-h" style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "transparent" }} onClick={() => onToast("Email change requires sign-in link.")}>
                  <span style={{ fontWeight: 500 }}>Change parent email</span>
                  <span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconLock s={12} /> Sensitive</span>
                </button>
                <button className="row-h" style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "transparent" }} onClick={() => onToast("Data export — soon.")}>
                  <span style={{ fontWeight: 500 }}>Export my data</span>
                  <IconChevron />
                </button>
                <button className="row-h" style={{ justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "transparent" }} onClick={() => onToast("Cancellation requires a sign-in link.")}>
                  <span style={{ fontWeight: 500, color: "var(--accent)" }}>Cancel subscription</span>
                  <span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconLock s={12} /> Sensitive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Add-profile modal ----------
function AddProfileModal({ onClose, onCreate, usedAvatarIds }) {
  const [name, setName] = React.useState("");
  // Pick the first unused avatar by default.
  const initial = AVATAR_LIST.find(a => !usedAvatarIds.includes(a.id)) || AVATAR_LIST[0];
  const [avatarId, setAvatarId] = React.useState(initial.id);
  const [age, setAge] = React.useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ display_name: name.trim(), avatar_id: avatarId, age_band: age || null });
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="row-h" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div className="eyebrow">New profile</div>
            <h2 className="display" style={{ marginTop: 6, fontSize: 32 }}>Who's joining?</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>A first name and an animal is all we need. You can change either later.</p>

        <form onSubmit={submit} className="stack gap-5">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24, alignItems: "center" }}>
            <div className="stack gap-2">
              <label className="field-label" htmlFor="kidname">Name</label>
              <input id="kidname" className="field" placeholder="Emma" value={name} onChange={e => setName(e.target.value)} autoFocus />

              <div className="field-label" style={{ marginTop: 16 }}>Age band <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { v: "under_5", l: "Under 5" },
                  { v: "5_7",     l: "5–7" },
                  { v: "8_10",    l: "8–10" },
                ].map(o => (
                  <button key={o.v} type="button"
                          className={"chip" + (age === o.v ? " accent" : "")}
                          style={{ padding: "8px 14px", cursor: "pointer", border: "0.5px solid var(--border)" }}
                          onClick={() => setAge(age === o.v ? "" : o.v)}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", placeItems: "center" }}>
              <Avatar id={avatarId} size={160} ring />
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{AVATAR_BY_ID[avatarId].name}</div>
            </div>
          </div>

          <div>
            <div className="field-label mb-2">Choose an animal</div>
            <div className="avatar-pick">
              {AVATAR_LIST.map(a => (
                <button key={a.id} type="button"
                        aria-pressed={avatarId === a.id}
                        disabled={usedAvatarIds.includes(a.id) && a.id !== avatarId}
                        style={{
                          background: a.tint,
                          opacity: (usedAvatarIds.includes(a.id) && a.id !== avatarId) ? 0.3 : 1,
                          cursor: (usedAvatarIds.includes(a.id) && a.id !== avatarId) ? "not-allowed" : "pointer",
                        }}
                        onClick={() => setAvatarId(a.id)}>
                  <a.cmp />
                </button>
              ))}
            </div>
          </div>

          <div className="row-h" style={{ justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              <IconCheck /> Add {name.trim() || "profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Switch-profile modal (kid mode) ----------
function SwitchProfileModal({ profile, onClose, onConfirmAdult }) {
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
          <h2 className="display" style={{ fontSize: 32 }}>Ask a grown-up.</h2>
          <p className="muted" style={{ marginTop: 10 }}>Swapping profiles needs a grown-up tap. {profile?.display_name}, hand the tablet over for a sec.</p>
          <div className="row-h" style={{ justifyContent: "center", gap: 10, marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={onClose}>Keep playing</button>
            <button className="btn btn-primary" onClick={onConfirmAdult}>I'm the grown-up</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Locked screen (from kid PWA redirect) ----------
function LockedScreen({ from, reason, onSignIn, onDash, signedIn }) {
  const reasonMap = {
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
  const r = reasonMap[reason] || reasonMap.locked;
  const fromApp = APP_BY_SLUG[from];

  return (
    <div className="shell shell-bg">
      <div className="topbar"><Wordmark /></div>
      <div className="container" style={{ display: "grid", placeItems: "center", flex: 1, paddingBottom: 64 }}>
        <div className="card" style={{ padding: 36, maxWidth: 520, width: "100%", textAlign: "center" }}>
          {fromApp && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 12px 6px 6px",
                          background: "var(--card-2)", borderRadius: 999, marginBottom: 20 }}>
              <span className="app-icon" style={{ width: 28, height: 28, borderRadius: 8, background: fromApp.bg, color: fromApp.color }}>
                <fromApp.icon />
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>From {fromApp.name}</span>
            </div>
          )}
          <div style={{ fontSize: 44 }}>{r.icon}</div>
          <h2 className="display" style={{ fontSize: 36, marginTop: 8 }}>{r.title}</h2>
          <p className="muted" style={{ marginTop: 12, fontSize: 16 }}>{r.sub}</p>
          <div className="row-h" style={{ justifyContent: "center", gap: 10, marginTop: 24 }}>
            {signedIn ? (
              <button className="btn btn-primary" onClick={onDash}>Open my account <IconArrowRight /></button>
            ) : (
              <button className="btn btn-primary" onClick={onSignIn}>Sign in <IconArrowRight /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export to window for app.jsx
Object.assign(window, {
  LoadingScreen, SignInScreen, SignInSentScreen,
  ProfilePickerScreen, AppGridScreen, ParentDashboardScreen,
  AddProfileModal, SwitchProfileModal, LockedScreen,
});
