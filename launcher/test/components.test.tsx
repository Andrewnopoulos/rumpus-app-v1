import { Route } from "react-router-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeAuth, renderWithRoutes, parentSession } from "./render";
import { ParentDashboard } from "../src/routes/ParentDashboard";

// The dashboard fetches GET /profiles on mount for richer rows; stub it.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ profiles: [] }) })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("ParentDashboard", () => {
  it("submits the add-profile form and creates a profile", async () => {
    const createProfile = vi
      .fn()
      .mockResolvedValue({ id: "n1", display_name: "Ada", avatar_id: 0, age_band: null, created_at: 0 });
    renderWithRoutes(
      makeAuth({ session: parentSession, createProfile }),
      "/dashboard",
      <Route path="/dashboard" element={<ParentDashboard />} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /add a profile/i }));

    const dialog = await screen.findByText("Who's joining?");
    const modal = dialog.closest(".modal") as HTMLElement;
    await userEvent.type(within(modal).getByLabelText("Name"), "Ada");
    await userEvent.click(within(modal).getByRole("button", { name: /add ada/i }));

    expect(createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Ada", avatar_id: expect.any(Number) }),
    );
  });

  it("signs out and routes to /signin", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderWithRoutes(
      makeAuth({ session: parentSession, signOut }),
      "/dashboard",
      <>
        <Route path="/dashboard" element={<ParentDashboard />} />
        <Route path="/signin" element={<div>SIGN IN PAGE</div>} />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalled();
    expect(await screen.findByText("SIGN IN PAGE")).toBeInTheDocument();
  });
});
