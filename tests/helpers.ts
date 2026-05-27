import { prisma } from "../src/lib/prisma.js";

// Test-side factory. Centralising the defaults means tests only have to
// state what they actually care about; the rest comes from here.
export async function createTask(overrides: Partial<{
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: Date;
}> = {}) {
  return prisma.task.create({
    data: {
      title: overrides.title ?? "Test task",
      description: overrides.description ?? null,
      status: overrides.status ?? "TODO",
      dueDate: overrides.dueDate ?? new Date("2026-12-31T10:00:00.000Z"),
    },
  });
}
