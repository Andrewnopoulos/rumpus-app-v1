import { describe, expect, it, vi } from "vitest";
import { Emitter } from "../src/events";
import type { MeResponse } from "../src/types";

const RESPONSE: MeResponse = { authenticated: false };

describe("Emitter", () => {
  it("invokes subscribed handlers with the payload", () => {
    const e = new Emitter();
    const handler = vi.fn();
    e.on("session-changed", handler);
    e.emit("session-changed", RESPONSE);
    expect(handler).toHaveBeenCalledWith(RESPONSE);
  });

  it("only delivers to handlers of the matching event", () => {
    const e = new Emitter();
    const changed = vi.fn();
    const expired = vi.fn();
    e.on("session-changed", changed);
    e.on("session-expired", expired);
    e.emit("session-changed", RESPONSE);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
  });

  it("stops calling a handler after it unsubscribes", () => {
    const e = new Emitter();
    const handler = vi.fn();
    const off = e.on("session-changed", handler);
    e.emit("session-changed", RESPONSE);
    off();
    e.emit("session-changed", RESPONSE);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("isolates a throwing handler from the others", () => {
    const e = new Emitter();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    e.on("session-changed", bad);
    e.on("session-changed", good);
    expect(() => e.emit("session-changed", RESPONSE)).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});
