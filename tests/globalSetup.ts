import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

// One-time setup: drop the test DB and re-apply migrations so every test run
// starts from a known empty schema. `prisma migrate deploy` is the "apply
// existing migrations" command - no migration creation, no prompts.

const TEST_DB = path.resolve(process.cwd(), "prisma", "test.db");

export default async function setup() {
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) {
    if (existsSync(f)) unlinkSync(f);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
