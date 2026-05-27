import pkg from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7's generated client is CommonJS; Node's ESM loader can't statically
// pick named exports from it, so we destructure from the default import.
const { PrismaClient, TaskStatus } = pkg;

// Idempotent seed: a wipe-and-replace is fine for a small fixture dataset and
// guarantees that re-running `npm run db:seed` puts the DB into a known state.
// For larger or production-ish seeds we'd use upserts keyed on a stable field.

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

const now = new Date();
const inDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

const tasks = [
  {
    title: "Review bundle for case CR-2026-00412",
    description:
      "Caseworker review of evidence bundle ahead of pre-trial hearing. Confirm all witness statements are paginated and indexed.",
    status: TaskStatus.IN_PROGRESS,
    dueDate: inDays(2),
  },
  {
    title: "Issue directions order to parties (FAM-2026-00781)",
    description:
      "Draft and issue directions following the case management hearing on 19 May. Send sealed copies to both legal representatives.",
    status: TaskStatus.TODO,
    dueDate: inDays(5),
  },
  {
    title: "Process fee remission application HWF-2026-9921",
    description:
      "Verify supporting income evidence and apply remission code if eligible. Notify applicant of outcome via MyHMCTS.",
    status: TaskStatus.TODO,
    dueDate: inDays(1),
  },
  {
    title: "Upload sealed order to CE-File for case CR-2026-00298",
    description: "Sealed order from HHJ Patel needs uploading to CE-File and serving on all parties.",
    status: TaskStatus.DONE,
    dueDate: inDays(-3),
  },
  {
    title: "Chase outstanding response from respondent (FAM-2026-00644)",
    description:
      "Form C7 was due 14 days ago. Send standard chaser letter and log on case notes; escalate to legal adviser if no reply within 7 days.",
    status: TaskStatus.IN_PROGRESS,
    dueDate: inDays(7),
  },
  {
    title: "Prepare court list for Crown Court sitting on Monday",
    description:
      "Compile the daily list for Court 3, cross-check listed times with the resident judge's clerk, and publish to CourtServe by 3pm.",
    status: TaskStatus.TODO,
    dueDate: inDays(3),
  },
];

async function main() {
  await prisma.task.deleteMany();
  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }
  console.log(`Seeded ${tasks.length} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
