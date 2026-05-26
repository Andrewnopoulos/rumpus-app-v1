import { defineConfig } from "vitest/config";

// happy-dom gives us window, localStorage, and location for the client tests.
export default defineConfig({
  test: {
    environment: "happy-dom",
  },
});
