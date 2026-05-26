// Test helpers: render a screen with a mock auth context (no real RumpusClient
// or network) wired into a MemoryRouter. Per the brief, screens are tested
// against a mocked session rather than a live API.

import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes } from "react-router-dom";
import { vi } from "vitest";
import type { MeResponse } from "@rumpusroom/auth-client";
import { AuthContext, type AuthContextValue } from "../src/auth/AuthProvider";
import { ToastProvider } from "../src/components/ToastProvider";

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: "ready",
    session: null,
    refresh: vi.fn().mockResolvedValue({ authenticated: false }),
    signOut: vi.fn().mockResolvedValue(undefined),
    requestMagicLink: vi.fn().mockResolvedValue(undefined),
    selectProfile: vi.fn().mockResolvedValue(undefined),
    deselectProfile: vi.fn().mockResolvedValue(undefined),
    createProfile: vi
      .fn()
      .mockResolvedValue({ id: "new", display_name: "New", avatar_id: 0, age_band: null, created_at: 0 }),
    ...overrides,
  };
}

export function renderWithRoutes(auth: AuthContextValue, initial: string, routes: ReactNode) {
  return render(
    <AuthContext.Provider value={auth}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>{routes}</Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );
}

export const parentSession: MeResponse = {
  authenticated: true,
  mode: "parent",
  elevated: false,
  parent: { id: "u1", email: "alex@rumpushome.com", display_name: "Alex" },
  family: { id: "f1", display_name: "Wallace" },
  co_parents: [],
  profiles: [
    { id: "p1", display_name: "Emma", avatar_id: 0 },
    { id: "p2", display_name: "Henry", avatar_id: 1 },
    { id: "p3", display_name: "Maya", avatar_id: 4 },
  ],
  subscription: { status: "active", plan: "monthly", current_period_end: 1900000000 },
  entitlements: {
    apps_unlocked: [
      "mr-know-it-all",
      "kaleidoscope-camera",
      "flipa-clone",
      "talking-tom-clone",
      "filter-app",
      "dinner-planner",
    ],
  },
};

export const kidSession: MeResponse = {
  authenticated: true,
  mode: "kid",
  profile: { id: "p1", display_name: "Emma", avatar_id: 0 },
  family_id: "f1",
  entitlements: { apps_unlocked: ["mr-know-it-all", "kaleidoscope-camera"] },
};
