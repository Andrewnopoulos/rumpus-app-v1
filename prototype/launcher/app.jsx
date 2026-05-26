// launcher/app.jsx
// Router + state + tweaks integration for the RumpusRoom launcher prototype.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "clay",
  "dark": false,
  "subscriptionStatus": "active",
  "profileCount": 3
}/*EDITMODE-END*/;

const MOCK_PROFILES_FULL = [
  { id: "p1", display_name: "Emma",   avatar_id: 0,  age_band: "5_7",     created_at: 1716200000 },
  { id: "p2", display_name: "Henry",  avatar_id: 1,  age_band: "under_5", created_at: 1718400000 },
  { id: "p3", display_name: "Maya",   avatar_id: 4,  age_band: "8_10",    created_at: 1720000000 },
  { id: "p4", display_name: "Theo",   avatar_id: 7,  age_band: "5_7",     created_at: 1722000000 },
  { id: "p5", display_name: "Ada",    avatar_id: 2,  age_band: "8_10",    created_at: 1723000000 },
];

function buildSession({ subscriptionStatus, profileCount }) {
  const profiles = MOCK_PROFILES_FULL.slice(0, profileCount);
  return {
    authenticated: true,
    mode: "parent",
    elevated: false,
    parent: { id: "u1", email: "alex@rumpushome.com", display_name: "Alex" },
    family: { id: "f1", display_name: "Wallace" },
    co_parents: [],
    profiles,
    subscription: {
      status: subscriptionStatus,
      plan: subscriptionStatus === "trialing" ? null : "monthly",
      current_period_end: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 18,
    },
    entitlements: {
      apps_unlocked: (subscriptionStatus === "active" || subscriptionStatus === "trialing")
        ? APPS.map(a => a.slug)
        : [],
    },
  };
}

function readUrlParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    palette:  sp.get("palette"),
    dark:     sp.get("dark"),
    route:    sp.get("route"),
    sub:      sp.get("sub"),
    profiles: sp.get("profiles"),
    embedded: sp.get("embedded") === "1",
  };
}

function App() {
  const urlParams = React.useMemo(readUrlParams, []);

  // Merge URL params over tweak defaults so canvas variants can preset things.
  const initialTweaks = React.useMemo(() => ({
    ...TWEAK_DEFAULTS,
    ...(urlParams.palette ? { palette: urlParams.palette } : {}),
    ...(urlParams.dark != null ? { dark: urlParams.dark === "true" } : {}),
    ...(urlParams.sub ? { subscriptionStatus: urlParams.sub } : {}),
    ...(urlParams.profiles ? { profileCount: parseInt(urlParams.profiles, 10) } : {}),
  }), []);

  const [t, setTweak] = useTweaks(initialTweaks);

  // Apply palette + dark to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute("data-palette", t.palette);
    document.documentElement.setAttribute("data-dark", t.dark ? "true" : "false");
  }, [t.palette, t.dark]);

  const [route, setRoute] = React.useState(urlParams.route || "signin"); // signin|sent|profiles|apps|dashboard|locked|loading
  const [email, setEmail] = React.useState(urlParams.route === "sent" ? "hello@home.com" : "");
  const [activeProfileId, setActiveProfileId] = React.useState(urlParams.route === "apps" ? "p1" : null);
  const [modal, setModal] = React.useState(null); // null | "add" | "switch"
  const [toast, setToast] = React.useState("");
  const [banner, setBanner] = React.useState(null); // for top-of-page banners
  const [lockedCtx, setLockedCtx] = React.useState({ from: "mr-know-it-all", reason: "locked" });
  const [signedIn, setSignedIn] = React.useState(["profiles", "apps", "dashboard"].includes(urlParams.route));

  // Build session live based on tweaks + local profile state
  const [extraProfiles, setExtraProfiles] = React.useState([]);
  const session = React.useMemo(() => {
    const base = buildSession({
      subscriptionStatus: t.subscriptionStatus,
      profileCount: t.profileCount,
    });
    return { ...base, profiles: [...base.profiles, ...extraProfiles] };
  }, [t.subscriptionStatus, t.profileCount, extraProfiles]);

  // Toasts auto-dismiss
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const activeProfile = session.profiles.find(p => p.id === activeProfileId) || session.profiles[0];

  // Navigation helpers
  function goSignIn(b) { setBanner(b || null); setRoute("signin"); }
  function goSent(e) { setEmail(e); setRoute("sent"); }
  function consumeLink() { setSignedIn(true); setRoute("profiles"); setBanner(null); }
  function pickProfile(id) { setActiveProfileId(id); setRoute("apps"); }
  function deselectProfile() { setActiveProfileId(null); setRoute("profiles"); setModal(null); }
  function signOut() { setSignedIn(false); setActiveProfileId(null); setRoute("signin"); setBanner(null); }
  function openDash() { setRoute("dashboard"); }
  function backToProfiles() { setRoute("profiles"); }
  function addProfile({ display_name, avatar_id, age_band }) {
    const newP = {
      id: "n" + Math.random().toString(36).slice(2, 7),
      display_name, avatar_id, age_band,
      created_at: Math.floor(Date.now() / 1000),
    };
    setExtraProfiles((arr) => [...arr, newP]);
    setModal(null);
    setToast(`${display_name} joined.`);
  }
  function launchApp(app) { setToast(`Opening ${app.name}…`); }

  // Tweaks-driven demo nav
  function jumpTo(target) {
    setBanner(null);
    if (target === "signin") { setSignedIn(false); setRoute("signin"); return; }
    if (target === "sent")   { setEmail("hello@home.com"); setRoute("sent"); return; }
    if (target === "profiles") { setSignedIn(true); setRoute("profiles"); return; }
    if (target === "apps")     { setSignedIn(true); setActiveProfileId(session.profiles[0]?.id); setRoute("apps"); return; }
    if (target === "dashboard"){ setSignedIn(true); setRoute("dashboard"); return; }
    if (target === "locked")   { setRoute("locked"); return; }
    if (target === "loading")  { setRoute("loading"); return; }
  }

  // The entitled apps for kid view
  const entitledApps = APPS.filter(a => session.entitlements.apps_unlocked.includes(a.slug));

  // Render current route
  let view;
  if (route === "loading") view = <LoadingScreen />;
  else if (route === "signin") view = <SignInScreen banner={banner} onSent={goSent} />;
  else if (route === "sent") view = <SignInSentScreen email={email} onBack={() => setRoute("signin")} onDemoConsume={consumeLink} />;
  else if (route === "profiles") view = (
    <ProfilePickerScreen
      profiles={session.profiles}
      onPickProfile={pickProfile}
      onParentDash={openDash}
      onAddProfile={() => setModal("add")}
      onSignOut={signOut}
      banner={banner}
    />
  );
  else if (route === "apps") view = (
    <AppGridScreen
      profile={activeProfile}
      apps={entitledApps}
      onLaunchApp={launchApp}
      onSwitchProfile={() => setModal("switch")}
    />
  );
  else if (route === "dashboard") view = (
    <ParentDashboardScreen
      session={session}
      onAddProfile={() => setModal("add")}
      onSignOut={signOut}
      onBack={backToProfiles}
      onToast={(m) => setToast(m)}
    />
  );
  else if (route === "locked") view = (
    <LockedScreen
      from={lockedCtx.from}
      reason={lockedCtx.reason}
      signedIn={signedIn}
      onSignIn={() => goSignIn({ icon: "👋", text: "Sign in to keep " + (APP_BY_SLUG[lockedCtx.from]?.name || "playing") + " going.", tone: "" })}
      onDash={openDash}
    />
  );

  return (
    <React.Fragment>
      {view}

      {modal === "add" && (
        <AddProfileModal
          onClose={() => setModal(null)}
          onCreate={addProfile}
          usedAvatarIds={session.profiles.map(p => p.avatar_id)}
        />
      )}
      {modal === "switch" && (
        <SwitchProfileModal
          profile={activeProfile}
          onClose={() => setModal(null)}
          onConfirmAdult={deselectProfile}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      {!urlParams.embedded && (
      <TweaksPanel>
        <TweakSection label="Palette" />
        <TweakRadio
          label="Theme"
          value={t.palette}
          options={[
            { value: "clay",   label: "Clay" },
            { value: "sea",    label: "Sea" },
            { value: "sage",   label: "Sage" },
            { value: "sunday", label: "Sunday" },
          ]}
          onChange={(v) => setTweak("palette", v)}
        />
        <TweakToggle
          label="Parent dark mode"
          value={t.dark}
          onChange={(v) => setTweak("dark", v)}
        />

        <TweakSection label="Demo data" />
        <TweakRadio
          label="Subscription"
          value={t.subscriptionStatus}
          options={[
            { value: "trialing", label: "Trial" },
            { value: "active",   label: "Active" },
            { value: "none",     label: "None" },
          ]}
          onChange={(v) => setTweak("subscriptionStatus", v)}
        />
        <TweakSlider
          label="Mock profiles"
          value={t.profileCount}
          min={0} max={5} step={1}
          onChange={(v) => setTweak("profileCount", v)}
        />

        <TweakSection label="Jump to screen" />
        <TweakSelect
          label="Route"
          value={route}
          options={[
            { value: "signin", label: "Sign in" },
            { value: "sent", label: "Sign in / sent" },
            { value: "profiles", label: "Profile picker" },
            { value: "apps", label: "Kid app grid" },
            { value: "dashboard", label: "Parent dashboard" },
            { value: "locked", label: "Locked redirect" },
            { value: "loading", label: "Loading" },
          ]}
          onChange={jumpTo}
        />
        <TweakSelect
          label="Locked from"
          value={lockedCtx.from}
          options={APPS.map(a => ({ value: a.slug, label: a.name }))}
          onChange={(v) => setLockedCtx({ ...lockedCtx, from: v })}
        />
        <TweakRadio
          label="Lock reason"
          value={lockedCtx.reason}
          options={[
            { value: "locked", label: "Locked" },
            { value: "expired", label: "Expired" },
            { value: "unauthenticated", label: "Signed out" },
          ]}
          onChange={(v) => setLockedCtx({ ...lockedCtx, reason: v })}
        />
      </TweaksPanel>
      )}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
