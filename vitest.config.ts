import { defineConfig } from "vitest/config";

// Tests run against a separate SQLite file so they can be wiped between
// specs without nuking dev data. globalSetup runs once per test run to
// migrate the test DB; setupFiles runs before each file to clear tables.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    // Single fork so SQLite isn't hammered by parallel connections - the
    // dataset is tiny and the per-test deleteMany keeps isolation cheap.
    forks: { singleFork: true },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "file:./test.db",
    },
  },
});
