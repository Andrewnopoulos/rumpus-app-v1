import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveLaunchUrl } from "../src/lib/apps";

function setHost(hostname: string) {
  vi.stubGlobal("location", { hostname });
}
afterEach(() => vi.unstubAllGlobals());

describe("resolveLaunchUrl", () => {
  it("rewrites a prod kid-app host to staging when the launcher is on staging", () => {
    setHost("staging.rumpusroom.app");
    expect(resolveLaunchUrl("https://kaleidoscope.rumpusroom.app/")).toBe(
      "https://kaleidoscope.staging.rumpusroom.app/",
    );
  });

  it("rewrites for a nested staging launcher host too", () => {
    setHost("app.staging.rumpusroom.app");
    expect(resolveLaunchUrl("https://flip.rumpusroom.app/")).toBe(
      "https://flip.staging.rumpusroom.app/",
    );
  });

  it("leaves URLs unchanged on the prod launcher", () => {
    setHost("rumpusroom.app");
    expect(resolveLaunchUrl("https://kaleidoscope.rumpusroom.app/")).toBe(
      "https://kaleidoscope.rumpusroom.app/",
    );
  });

  it("leaves URLs unchanged on localhost", () => {
    setHost("localhost");
    expect(resolveLaunchUrl("https://kaleidoscope.rumpusroom.app/")).toBe(
      "https://kaleidoscope.rumpusroom.app/",
    );
  });

  it("does not double-rewrite an already-staging URL", () => {
    setHost("staging.rumpusroom.app");
    expect(resolveLaunchUrl("https://kaleidoscope.staging.rumpusroom.app/")).toBe(
      "https://kaleidoscope.staging.rumpusroom.app/",
    );
  });
});
