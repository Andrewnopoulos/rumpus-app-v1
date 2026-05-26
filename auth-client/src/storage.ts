// localStorage wrapper that never throws. In private-browsing or embedded
// contexts localStorage can throw on access, so every call is guarded and we
// fall back to an in-memory copy.

import type { CacheEnvelope } from "./types";

export const STORAGE_KEY = "rumpus.session.v1";

export class SessionStore {
  private memory: CacheEnvelope | null = null;

  read(): CacheEnvelope | null {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (raw != null) return JSON.parse(raw) as CacheEnvelope;
    } catch {
      // localStorage unavailable, or stored value isn't valid JSON.
    }
    return this.memory;
  }

  write(envelope: CacheEnvelope): void {
    this.memory = envelope;
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Persist to memory only.
    }
  }

  clear(): void {
    this.memory = null;
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do.
    }
  }
}
