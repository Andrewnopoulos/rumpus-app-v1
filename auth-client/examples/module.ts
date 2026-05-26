// ESM usage example — the recommended boot pattern for a kid PWA.
//
//   import { RumpusClient } from "@rumpusroom/auth-client";
//
// (Imported from a relative path here so the example type-checks in-repo.)
import { RumpusClient } from "../src/index";

const rumpus = new RumpusClient({ appSlug: "kaleidoscope-camera" });

async function boot(): Promise<void> {
  // getSession() uses a TTL cache: within cacheTTLSeconds (default 60) it
  // returns cache with no network call; past the TTL it blocks on a fresh /me
  // fetch and only falls back to cache (marked stale: true) if that fails.
  // Use refresh() to bypass the TTL when you need current state immediately.
  const session = await rumpus.getSession();

  if (!session.authenticated) {
    rumpus.redirectToLauncher("unauthenticated");
    return;
  }

  if (!rumpus.isAppUnlocked()) {
    rumpus.redirectToLauncher("locked");
    return;
  }

  if (session.mode !== "kid") {
    // Opened in parent mode — usually a parent previewing. Default: allow.
    // The PWA decides its own policy here.
  }

  const profile = rumpus.currentProfile();
  console.log("Booting for", profile?.display_name ?? "parent preview");
}

// Handle expiry when it surfaces (e.g. the subscription lapsed or a parent
// signed out on another device). This client is poll-on-demand, not live: the
// event fires on the next getSession()/refresh() that returns unauthenticated,
// not the instant the change happens elsewhere.
rumpus.on("session-expired", () => {
  saveAppState();
  rumpus.redirectToLauncher("expired");
});

rumpus.on("entitlement-changed", () => {
  if (!rumpus.isAppUnlocked()) {
    saveAppState();
    rumpus.redirectToLauncher("locked");
  }
});

function saveAppState(): void {
  // Persist whatever in-progress state the PWA holds before navigating away.
}

void boot();
