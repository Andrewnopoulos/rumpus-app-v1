import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionStore, STORAGE_KEY } from "../src/storage";
import type { CacheEnvelope } from "../src/types";

const ENVELOPE: CacheEnvelope = {
  response: { authenticated: false },
  fetchedAt: 1000,
};

describe("SessionStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips through localStorage", () => {
    const store = new SessionStore();
    store.write(ENVELOPE);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(store.read()).toEqual(ENVELOPE);
  });

  it("clear() removes the value", () => {
    const store = new SessionStore();
    store.write(ENVELOPE);
    store.clear();
    expect(store.read()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("falls back to memory when setItem throws (e.g. private mode)", () => {
    const store = new SessionStore();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => store.write(ENVELOPE)).not.toThrow();
    // getItem returns null (nothing persisted) → read returns the memory copy.
    expect(store.read()).toEqual(ENVELOPE);
  });

  it("returns memory when getItem throws", () => {
    const store = new SessionStore();
    store.write(ENVELOPE); // persisted + memory
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(store.read()).toEqual(ENVELOPE);
  });

  it("returns null when the stored value is corrupt JSON and no memory", () => {
    const store = new SessionStore();
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(store.read()).toBeNull();
  });
});
