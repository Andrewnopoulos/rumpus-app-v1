// RumpusClient: session + entitlement client for RumpusRoom kid PWAs.
//
// Cache model (decided with the owner):
//  - Fresh cache (age < cacheTTLSeconds) is served with no network call.
//  - Stale cache (age >= TTL) triggers a fetch; getSession() resolves with the
//    fresh response. Cached data is only returned (marked stale) if the fetch
//    fails. This keeps the lock/entitlement decision correct on the boot path.
//  - currentProfile()/isAppUnlocked() read in-memory state, hydrated from any
//    cached response at construction so returning users get instant answers.

import { Emitter } from "./events";
import { SessionStore } from "./storage";
import type {
  KidProfile,
  MeResponse,
  RedirectReason,
  RumpusClientConfig,
  RumpusEvent,
} from "./types";

const DEFAULT_API_BASE = "https://api.rumpusroom.app";
const LAUNCHER_URL = "https://rumpusroom.app/";
const DEFAULT_TTL_SECONDS = 60;

function nowSeconds(): number {
  return Date.now() / 1000;
}

function appsUnlockedOf(response: MeResponse | null): string[] | null {
  return response && response.authenticated ? response.entitlements.apps_unlocked : null;
}

function sameAppSet(a: string[] | null, b: string[] | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((slug) => setB.has(slug));
}

function withoutStale(response: MeResponse): unknown {
  const clone: Record<string, unknown> = { ...(response as Record<string, unknown>) };
  delete clone.stale;
  return clone;
}

function sameResponse(a: MeResponse | null, b: MeResponse | null): boolean {
  if (a === null || b === null) return a === b;
  return JSON.stringify(withoutStale(a)) === JSON.stringify(withoutStale(b));
}

export class RumpusClient {
  readonly appSlug: string;
  private readonly apiBase: string;
  private readonly ttlSeconds: number;
  private readonly allowStaleFallback: boolean;
  private readonly store = new SessionStore();
  private readonly emitter = new Emitter();
  private lastResponse: MeResponse | null = null;
  private warned = false;

  constructor(config: RumpusClientConfig) {
    if (!config || typeof config.appSlug !== "string" || config.appSlug.length === 0) {
      throw new Error("RumpusClient: `appSlug` is required.");
    }
    this.appSlug = config.appSlug;
    this.apiBase = (config.apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, "");
    this.ttlSeconds = config.cacheTTLSeconds ?? DEFAULT_TTL_SECONDS;
    this.allowStaleFallback = config.allowStaleFallback ?? true;

    // Hydrate synchronous getters from a prior cached session, if any.
    const cached = this.store.read();
    if (cached) this.lastResponse = cached.response;
  }

  /** Fetch /me, honoring the TTL cache. See cache model note at top. */
  async getSession(): Promise<MeResponse> {
    const cached = this.store.read();
    if (cached && nowSeconds() - cached.fetchedAt < this.ttlSeconds) {
      this.lastResponse = cached.response;
      return cached.response;
    }
    return this.fetchMe(cached?.response ?? this.lastResponse ?? null);
  }

  /** Like getSession() but always hits the network, ignoring the TTL cache. */
  async refresh(): Promise<MeResponse> {
    const cached = this.store.read();
    return this.fetchMe(cached?.response ?? this.lastResponse ?? null);
  }

  /** True iff the last known session unlocks this PWA's appSlug. Never throws. */
  isAppUnlocked(): boolean {
    const r = this.lastResponse;
    if (!r || !r.authenticated) return false;
    return r.entitlements.apps_unlocked.includes(this.appSlug);
  }

  /** The active kid profile if in kid mode, else null. */
  currentProfile(): KidProfile | null {
    const r = this.lastResponse;
    if (r && r.authenticated && r.mode === "kid") {
      return {
        id: r.profile.id,
        display_name: r.profile.display_name,
        avatar_id: r.profile.avatar_id,
      };
    }
    return null;
  }

  /** Navigate to the launcher, passing this app's slug and an optional reason. */
  redirectToLauncher(reason?: RedirectReason): void {
    const params = new URLSearchParams({ from: this.appSlug });
    if (reason) params.set("reason", reason);
    const url = `${LAUNCHER_URL}?${params.toString()}`;
    if (typeof window !== "undefined" && window.location) {
      window.location.assign(url);
    }
  }

  /** Subscribe to an event; returns an unsubscribe function. */
  on(event: RumpusEvent, handler: (response: MeResponse) => void): () => void {
    return this.emitter.on(event, handler);
  }

  /** Sign out: best-effort POST, then clear local state and fire session-changed. */
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.apiBase}/auth/signout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      this.warnOnce(err);
    }
    this.store.clear();
    const unauth: MeResponse = { authenticated: false };
    this.lastResponse = unauth;
    this.emitter.emit("session-changed", unauth);
  }

  private async fetchMe(fallback: MeResponse | null): Promise<MeResponse> {
    const previous = this.lastResponse;
    try {
      const res = await fetch(`${this.apiBase}/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        const unauth: MeResponse = { authenticated: false };
        this.store.clear();
        this.warned = false;
        if (previous && previous.authenticated) {
          this.emitter.emit("session-expired", unauth);
        }
        this.commit(unauth, previous);
        return unauth;
      }

      if (!res.ok) {
        throw new Error(`GET /me failed with status ${res.status}`);
      }

      const data = (await res.json()) as MeResponse;
      this.warned = false;
      this.store.write({ response: data, fetchedAt: nowSeconds() });
      this.commit(data, previous);
      return data;
    } catch (err) {
      this.warnOnce(err);
      if (this.allowStaleFallback && fallback) {
        const stale = { ...fallback, stale: true } as MeResponse;
        this.lastResponse = stale;
        return stale;
      }
      throw err;
    }
  }

  /** Record a fresh response and fire change events relative to the previous one. */
  private commit(next: MeResponse, previous: MeResponse | null): void {
    this.lastResponse = next;
    if (!sameResponse(previous, next)) {
      this.emitter.emit("session-changed", next);
    }
    // entitlement-changed compares apps_unlocked between fetches. It must not
    // fire on the transition to unauthenticated — that's session-expired's job.
    // Firing both lets an entitlement-changed handler clobber the redirect
    // reason on sign-out/expiry (e.g. "locked" overwriting "expired").
    if (
      previous !== null &&
      next.authenticated &&
      !sameAppSet(appsUnlockedOf(previous), appsUnlockedOf(next))
    ) {
      this.emitter.emit("entitlement-changed", next);
    }
  }

  private warnOnce(err: unknown): void {
    if (this.warned) return;
    this.warned = true;
    console.warn(
      "[RumpusClient] request to the RumpusRoom API failed; serving cached session if available.",
      err,
    );
  }
}
