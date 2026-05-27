import { beforeEach, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";

// Per-test isolation: every test starts with an empty Task table. Cheaper
// than tearing the DB down and re-migrating, and good enough for a single
// model without FK constraints.
beforeEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
