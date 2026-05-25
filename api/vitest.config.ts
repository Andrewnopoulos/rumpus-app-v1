import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  // Read migrations once; tests apply them to the local D1 in a setup file.
  const migrations = await readD1Migrations(path.join(__dirname, "migrations"));

  return {
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            bindings: {
              SESSION_SECRET: "test-session-secret",
              TEST_MIGRATIONS: migrations,
            },
          },
        },
      },
    },
  };
});
