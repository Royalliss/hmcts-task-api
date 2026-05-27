import { describe, it, expect } from "vitest";
import { tasksService } from "../src/services/tasks.service.js";
import { NotFoundError } from "../src/errors.js";
import { createTask } from "./helpers.js";

describe("tasksService", () => {
  describe("create", () => {
    it("persists a new task with sensible defaults", async () => {
      const task = await tasksService.create({
        title: "Issue directions order",
        description: null,
        dueDate: new Date("2026-07-01T10:00:00.000Z"),
      });
      expect(task.id).toBeTruthy();
      expect(task.title).toBe("Issue directions order");
      expect(task.status).toBe("TODO");
      expect(task.description).toBeNull();
    });

    it("respects an explicitly provided status", async () => {
      const task = await tasksService.create({
        title: "x",
        description: null,
        status: "IN_PROGRESS",
        dueDate: new Date("2026-07-01T10:00:00.000Z"),
      });
      expect(task.status).toBe("IN_PROGRESS");
    });
  });

  describe("list", () => {
    it("returns all tasks ordered by due date asc", async () => {
      await createTask({ title: "later", dueDate: new Date("2026-12-01T00:00:00Z") });
      await createTask({ title: "sooner", dueDate: new Date("2026-06-01T00:00:00Z") });
      const tasks = await tasksService.list();
      expect(tasks).toHaveLength(2);
      expect(tasks[0]!.title).toBe("sooner");
    });

    it("returns an empty array when no tasks exist", async () => {
      expect(await tasksService.list()).toEqual([]);
    });
  });

  describe("getById", () => {
    it("returns a task when it exists", async () => {
      const created = await createTask();
      const found = await tasksService.getById(created.id);
      expect(found.id).toBe(created.id);
    });

    it("throws NotFoundError when the id does not exist", async () => {
      await expect(tasksService.getById("does-not-exist")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates the supplied fields and leaves others intact", async () => {
      const created = await createTask({ title: "old", description: "keep" });
      const updated = await tasksService.update(created.id, { title: "new" });
      expect(updated.title).toBe("new");
      expect(updated.description).toBe("keep");
    });

    it("throws NotFoundError when target is missing", async () => {
      await expect(tasksService.update("nope", { title: "x" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("updateStatus", () => {
    it("changes the status field", async () => {
      const created = await createTask({ status: "TODO" });
      const updated = await tasksService.updateStatus(created.id, { status: "DONE" });
      expect(updated.status).toBe("DONE");
    });

    it("throws NotFoundError when target is missing", async () => {
      await expect(
        tasksService.updateStatus("nope", { status: "DONE" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("remove", () => {
    it("deletes the task", async () => {
      const created = await createTask();
      await tasksService.remove(created.id);
      await expect(tasksService.getById(created.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError when target is missing", async () => {
      await expect(tasksService.remove("nope")).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
