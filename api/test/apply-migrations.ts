// Applies D1 migrations to the test database before each test file runs.
import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
