import type { Env } from "../src/env";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {
    // Bound in vitest.config.ts; consumed by test/apply-migrations.ts.
    TEST_MIGRATIONS: Parameters<typeof import("cloudflare:test").applyD1Migrations>[1];
  }
}
