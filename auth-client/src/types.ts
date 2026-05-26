// Shared types for @rumpusroom/auth-client. MeResponse mirrors the shape the
// RumpusRoom API returns from GET /me.

export interface ParentInfo {
  id: string;
  email: string;
  display_name: string | null;
}

export interface FamilyInfo {
  id: string;
  display_name: string | null;
}

export interface KidProfile {
  id: string;
  display_name: string;
  avatar_id: number;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "unpaid"
  | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: "monthly" | "annual" | null;
  current_period_end: number | null;
}

export interface Entitlements {
  apps_unlocked: string[];
}

/** Discriminated union mirroring the API's GET /me response shapes. */
export type MeResponse =
  | { authenticated: false; stale?: boolean }
  | {
      authenticated: true;
      mode: "parent";
      elevated: boolean;
      parent: ParentInfo;
      family: FamilyInfo;
      co_parents: ParentInfo[];
      profiles: KidProfile[];
      subscription: SubscriptionInfo;
      entitlements: Entitlements;
      stale?: boolean;
    }
  | {
      authenticated: true;
      mode: "kid";
      profile: KidProfile;
      family_id: string;
      entitlements: Entitlements;
      stale?: boolean;
    };

export type RumpusEvent =
  | "session-changed"
  | "session-expired"
  | "entitlement-changed";

export type RedirectReason = "locked" | "unauthenticated" | "expired";

export interface RumpusClientConfig {
  /** API origin. Default 'https://api.rumpusroom.app'. */
  apiBase?: string;
  /** This PWA's slug, e.g. 'kaleidoscope-camera'. Required. */
  appSlug: string;
  /** Seconds a cached /me response is served without a network call. Default 60. */
  cacheTTLSeconds?: number;
  /**
   * When true (default), a failed fetch falls back to cached data marked
   * `stale: true` instead of rejecting. When false, failures reject.
   */
  allowStaleFallback?: boolean;
}

/** What we persist in localStorage under the versioned key. */
export interface CacheEnvelope {
  response: MeResponse;
  fetchedAt: number; // Date.now() / 1000
}
