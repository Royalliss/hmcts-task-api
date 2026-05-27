import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "../schemas/task.schemas.js";

// Service layer. The controller layer is HTTP-aware (req/res/status codes);
// the service layer is not - it only knows about the domain. That split keeps
// the service trivially unit-testable without needing an Express request.
//
// We deliberately re-query inside update/delete first so we can throw a
// proper NotFoundError. Prisma would throw a P2025 otherwise, but mapping it
// loses the resource name and makes the central error handler messier.

export const tasksService = {
  async list() {
    return prisma.task.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  },

  async getById(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError("Task", id);
    return task;
  },

  async create(data: CreateTaskInput) {
    return prisma.task.create({ data });
  },

  async update(id: string, data: UpdateTaskInput) {
    await tasksService.getById(id);
    return prisma.task.update({ where: { id }, data });
  },

  async updateStatus(id: string, data: UpdateTaskStatusInput) {
    await tasksService.getById(id);
    return prisma.task.update({ where: { id }, data: { status: data.status } });
  },

  async remove(id: string) {
    await tasksService.getById(id);
    await prisma.task.delete({ where: { id } });
  },
};
