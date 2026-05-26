// AuthProvider boot: the real provider with RumpusClient mocked. Shows the
// Loading view while /me is in flight, then resolves to the right screen.

import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// A controllable RumpusClient stand-in. getSession resolves with whatever the
// test parks in `hoisted.session` (default: a deferred promise we resolve).
const hoisted = vi.hoisted(() => ({
  resolve: undefined as undefined | ((v: unknown) => void),
  next: undefined as undefined | (() => Promise<unknown>),
}));

vi.mock("@rumpusroom/auth-client", () => ({
  RumpusClient: class {
    constructor(_cfg: unknown) {}
    getSession() {
      return hoisted.next ? hoisted.next() : new Promise((r) => (hoisted.resolve = r));
    }
    refresh() {
      return this.getSession();
    }
    signOut() {
      return Promise.resolve();
    }
    on() {
      return () => {};
    }
  },
}));

import { App } from "../src/App";

afterEach(() => {
  hoisted.resolve = undefined;
  hoisted.next = undefined;
  vi.restoreAllMocks();
});

describe("AuthProvider boot", () => {
  it("shows Loading on mount, then resolves to the profile picker for a parent", async () => {
    render(<App />);

    // First /me is still in flight → Loading view.
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await act(async () => {
      hoisted.resolve?.({
        authenticated: true,
        mode: "parent",
        elevated: false,
        parent: { id: "u1", email: "a@b.com", display_name: null },
        family: { id: "f1", display_name: "Wallace" },
        co_parents: [],
        profiles: [{ id: "p1", display_name: "Emma", avatar_id: 0 }],
        subscription: { status: "active", plan: "monthly", current_period_end: 1900000000 },
        entitlements: { apps_unlocked: ["mr-know-it-all"] },
      });
    });

    expect(await screen.findByText(/Who's playing/)).toBeInTheDocument();
    expect(screen.getByText("Emma")).toBeInTheDocument();
  });

  it("resolves an unauthenticated session to the sign-in screen", async () => {
    hoisted.next = () => Promise.resolve({ authenticated: false });
    render(<App />);
    expect(await screen.findByText(/Step into the/)).toBeInTheDocument();
  });
});
