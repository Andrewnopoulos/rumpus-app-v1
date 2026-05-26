import { Route } from "react-router-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeAuth, renderWithRoutes, parentSession, kidSession } from "./render";
import { ApiError } from "../src/lib/api";
import { SignIn } from "../src/routes/SignIn";
import { SignInSent } from "../src/routes/SignInSent";
import { ProfilePicker } from "../src/routes/ProfilePicker";
import { AppGrid } from "../src/routes/AppGrid";

describe("SignIn", () => {
  it("submits the email and navigates to the sent screen on success", async () => {
    const requestMagicLink = vi.fn().mockResolvedValue(undefined);
    const auth = makeAuth({ requestMagicLink });
    renderWithRoutes(
      auth,
      "/signin",
      <>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signin/sent" element={<SignInSent />} />
      </>,
    );

    await userEvent.type(screen.getByLabelText("Parent email"), "alex@home.com");
    await userEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    expect(requestMagicLink).toHaveBeenCalledWith("alex@home.com");
    expect(await screen.findByText("Check your email.")).toBeInTheDocument();
  });

  it("shows a rate-limit message on 429 and does not navigate", async () => {
    const requestMagicLink = vi
      .fn()
      .mockRejectedValue(new ApiError(429, "rate_limited", "Too many magic-link requests."));
    const auth = makeAuth({ requestMagicLink });
    renderWithRoutes(
      auth,
      "/signin",
      <>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signin/sent" element={<SignInSent />} />
      </>,
    );

    await userEvent.type(screen.getByLabelText("Parent email"), "alex@home.com");
    await userEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    expect(await screen.findByText(/too many tries/i)).toBeInTheDocument();
    expect(screen.queryByText("Check your email.")).not.toBeInTheDocument();
  });
});

describe("ProfilePicker", () => {
  it("renders every profile from the session", () => {
    renderWithRoutes(
      makeAuth({ session: parentSession }),
      "/profiles",
      <Route path="/profiles" element={<ProfilePicker />} />,
    );
    expect(screen.getByText("Emma")).toBeInTheDocument();
    expect(screen.getByText("Henry")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });

  it("selects a profile on tap and routes to /apps", async () => {
    const selectProfile = vi.fn().mockResolvedValue(undefined);
    renderWithRoutes(
      makeAuth({ session: parentSession, selectProfile }),
      "/profiles",
      <>
        <Route path="/profiles" element={<ProfilePicker />} />
        <Route path="/apps" element={<div>APPS PAGE</div>} />
      </>,
    );

    await userEvent.click(screen.getByText("Emma"));

    expect(selectProfile).toHaveBeenCalledWith("p1");
    expect(await screen.findByText("APPS PAGE")).toBeInTheDocument();
  });
});

describe("AppGrid", () => {
  it("renders only the entitled apps", () => {
    renderWithRoutes(
      makeAuth({ session: kidSession }),
      "/apps",
      <Route path="/apps" element={<AppGrid />} />,
    );
    expect(screen.getByText("Mr Know-it-all")).toBeInTheDocument();
    expect(screen.getByText("Kaleidoscope")).toBeInTheDocument();
    // dinner-planner is not in apps_unlocked for the kid fixture
    expect(screen.queryByText("Dinner Vote")).not.toBeInTheDocument();
  });

  it("deselects via the switch-profile modal and routes to /profiles", async () => {
    const deselectProfile = vi.fn().mockResolvedValue(undefined);
    renderWithRoutes(
      makeAuth({ session: kidSession, deselectProfile }),
      "/apps",
      <>
        <Route path="/apps" element={<AppGrid />} />
        <Route path="/profiles" element={<div>PICKER PAGE</div>} />
      </>,
    );

    await userEvent.click(screen.getByText(/not emma\?/i));
    await userEvent.click(screen.getByRole("button", { name: /i'm the grown-up/i }));

    expect(deselectProfile).toHaveBeenCalled();
    expect(await screen.findByText("PICKER PAGE")).toBeInTheDocument();
  });
});
