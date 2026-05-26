// Tiny dependency-free event emitter. One payload type (MeResponse) across all
// events keeps the surface small; handlers that throw are isolated.

import type { MeResponse, RumpusEvent } from "./types";

type Handler = (response: MeResponse) => void;

export class Emitter {
  private handlers = new Map<RumpusEvent, Set<Handler>>();

  /** Subscribe; returns an unsubscribe function. */
  on(event: RumpusEvent, handler: Handler): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  emit(event: RumpusEvent, response: MeResponse): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Snapshot so a handler may unsubscribe itself mid-dispatch safely.
    for (const handler of [...set]) {
      try {
        handler(response);
      } catch (err) {
        console.error(`[RumpusClient] a "${event}" listener threw:`, err);
      }
    }
  }
}
