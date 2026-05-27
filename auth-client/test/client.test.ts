import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RumpusClient } from "../src/client";
import { STORAGE_KEY } from "../src/storage";
import type { MeResponse } from "../src/types";

const APP = "kaleidoscope-camera";
const API_BASE = "http://localhost:8787";

function parentMe(apps: string[]): MeResponse {
  return {
    authenticated: true,
    mode: "parent",
    elevated: false,
    parent: { id: "p1", email: "a@b.com", display_name: null },
    family: { id: "f1", display_name: null },
    co_parents: [],
    profiles: [],
    subscription: {
      status: apps.length ? "active" : "none",
      plan: apps.length ? "monthly" : null,
      current_period_end: null,
    },
    entitlements: { apps_unlocked: apps },
  };
}

function kidMe(apps: string[]): MeResponse {
  return {
    authenticated: true,
    mode: "kid",
    profile: { id: "k1", display_name: "Alex", avatar_id: 3 },
    family_id: "f1",
    entitlements: { apps_unlocked: apps },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function unauthorized(): Response {
  return new Response(null, { status: 401 });
}

let fetchMock: ReturnType<typeof vi.fn>;

/** Client whose cache is always stale, so every getSession() hits the network. */
function freshClient() {
  return new RumpusClient({ appSlug: APP, apiBase: API_BASE, cacheTTLSeconds: 0 });
}

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getSession", () => {
  it("returns the parsed response on 200", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    const res = await client.getSession();
    expect(res.authenticated).toBe(true);
    expect((res as any).mode).toBe("parent");
    expect((res as any).entitlements.apps_unlocked).toContain(APP);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/me`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("serves fresh cache without a network call inside the TTL", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE, cacheTTLSeconds: 60 });
    await client.getSession();
    await client.getSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the cached response with stale: true on network error", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockRejectedValueOnce(new Error("network down"));
    const client = freshClient();
    await client.getSession();
    const res = await client.getSession();
    expect(res.authenticated).toBe(true);
    expect(res.stale).toBe(true);
  });

  it("returns { authenticated: false } on 401 and clears the cache", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockResolvedValueOnce(unauthorized());
    const client = freshClient();
    await client.getSession();
    const res = await client.getSession();
    expect(res).toEqual({ authenticated: false });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(client.isAppUnlocked()).toBe(false);
  });
});

describe("isAppUnlocked", () => {
  it("is true when the slug is unlocked", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP, "dinner-planner"])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.isAppUnlocked()).toBe(true);
  });

  it("is false before any fetch", () => {
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    expect(client.isAppUnlocked()).toBe(false);
  });

  it("is false when the slug is not unlocked", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe(["dinner-planner"])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.isAppUnlocked()).toBe(false);
  });

  it("is false when unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.isAppUnlocked()).toBe(false);
  });
});

describe("currentProfile", () => {
  it("returns the profile in kid mode", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(kidMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.currentProfile()).toEqual({ id: "k1", display_name: "Alex", avatar_id: 3 });
  });

  it("returns null in parent mode", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.currentProfile()).toBeNull();
  });

  it("returns null when unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();
    expect(client.currentProfile()).toBeNull();
  });
});

describe("events", () => {
  it("fires session-expired on 401 after a prior authenticated response", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockResolvedValueOnce(unauthorized());
    const client = freshClient();
    await client.getSession();
    const expired = vi.fn();
    client.on("session-expired", expired);
    await client.getSession();
    expect(expired).toHaveBeenCalledTimes(1);
    expect(expired).toHaveBeenCalledWith({ authenticated: false });
  });

  it("fires entitlement-changed when apps_unlocked changes between fetches", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockResolvedValueOnce(jsonResponse(parentMe([APP, "mr-know-it-all"])));
    const client = freshClient();
    await client.getSession();
    const changed = vi.fn();
    client.on("entitlement-changed", changed);
    await client.getSession();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("does not fire entitlement-changed on expiry (session-expired owns it)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockResolvedValueOnce(unauthorized());
    const client = freshClient();
    await client.getSession();
    const changed = vi.fn();
    client.on("entitlement-changed", changed);
    await client.getSession();
    expect(changed).not.toHaveBeenCalled();
  });

  it("does not fire entitlement-changed when apps_unlocked is unchanged", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])))
      .mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = freshClient();
    await client.getSession();
    const changed = vi.fn();
    client.on("entitlement-changed", changed);
    await client.getSession();
    expect(changed).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("clears the cache and fires session-changed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    await client.getSession();

    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const changed = vi.fn();
    client.on("session-changed", changed);
    await client.signOut();

    expect(changed).toHaveBeenCalledWith({ authenticated: false });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(client.isAppUnlocked()).toBe(false);
    expect(fetchMock).toHaveBeenLastCalledWith(`${API_BASE}/auth/signout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });
});

describe("resilience", () => {
  it("hydrates synchronous getters from cache on construction", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    await new RumpusClient({ appSlug: APP, apiBase: API_BASE }).getSession();

    // A brand-new client (same origin/localStorage) should know the state
    // synchronously, before any getSession() call resolves.
    const returning = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    expect(returning.isAppUnlocked()).toBe(true);
  });

  it("does not crash when localStorage throws; falls back to in-memory", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("private mode");
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(parentMe([APP])));
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    const res = await client.getSession();
    expect(res.authenticated).toBe(true);
    expect(client.isAppUnlocked()).toBe(true);
  });

  it("redirectToLauncher builds the launcher URL with from and reason", () => {
    const assign = vi.fn();
    vi.spyOn(window.location, "assign").mockImplementation(assign);
    const client = new RumpusClient({ appSlug: APP, apiBase: API_BASE });
    client.redirectToLauncher("locked");
    expect(assign).toHaveBeenCalledWith(
      "https://rumpusroom.app/?from=kaleidoscope-camera&reason=locked",
    );
  });

  it("redirectToLauncher honors a custom launcherBase (e.g. staging)", () => {
    const assign = vi.fn();
    vi.spyOn(window.location, "assign").mockImplementation(assign);
    const client = new RumpusClient({
      appSlug: APP,
      apiBase: API_BASE,
      launcherBase: "https://staging.rumpusroom.app",
    });
    client.redirectToLauncher("unauthenticated");
    expect(assign).toHaveBeenCalledWith(
      "https://staging.rumpusroom.app/?from=kaleidoscope-camera&reason=unauthenticated",
    );
  });

  it("throws if appSlug is missing", () => {
    // @ts-expect-error intentionally omitting required appSlug
    expect(() => new RumpusClient({})).toThrow(/appSlug/);
  });
});
