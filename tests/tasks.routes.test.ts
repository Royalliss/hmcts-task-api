import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { createTask } from "./helpers.js";

// Route tests exercise the full HTTP stack (middleware -> validate -> ctrl
// -> service -> db) using supertest. They check status codes and wire-shape
// only; deep behaviour belongs in the service tests.

describe("Tasks API", () => {
  describe("GET /api/v1/tasks", () => {
    it("returns 200 and an empty array when no tasks exist", async () => {
      const res = await request(app).get("/api/v1/tasks");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [] });
    });

    it("returns the seeded tasks", async () => {
      await createTask({ title: "alpha" });
      await createTask({ title: "beta" });
      const res = await request(app).get("/api/v1/tasks");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/v1/tasks", () => {
    it("creates and returns the new task with 201", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .send({
          title: "Process fee remission",
          description: "verify income evidence",
          dueDate: "2026-08-01T10:00:00.000Z",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.title).toBe("Process fee remission");
      expect(res.body.data.status).toBe("TODO");
    });

    it("returns 400 with details when required fields are missing", async () => {
      const res = await request(app).post("/api/v1/tasks").send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(res.body.error.details)).toBe(true);
      const paths = res.body.error.details.map((d: { path: string }) => d.path);
      expect(paths).toContain("body.title");
      expect(paths).toContain("body.dueDate");
    });

    it("returns 400 for an invalid status value", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .send({ title: "x", dueDate: "2026-08-01T10:00:00.000Z", status: "PENDING" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for a malformed dueDate", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .send({ title: "x", dueDate: "tomorrow" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/tasks/:id", () => {
    it("returns 200 and the task when it exists", async () => {
      const created = await createTask({ title: "lookup-me" });
      const res = await request(app).get(`/api/v1/tasks/${created.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("lookup-me");
    });

    it("returns 404 when the task does not exist", async () => {
      const res = await request(app).get("/api/v1/tasks/does-not-exist");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/tasks/:id/status", () => {
    it("updates the status and returns the task", async () => {
      const created = await createTask({ status: "TODO" });
      const res = await request(app)
        .patch(`/api/v1/tasks/${created.id}/status`)
        .send({ status: "DONE" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("DONE");
    });

    it("returns 400 when the status value is invalid", async () => {
      const created = await createTask();
      const res = await request(app)
        .patch(`/api/v1/tasks/${created.id}/status`)
        .send({ status: "ARCHIVED" });
      expect(res.status).toBe(400);
    });

    it("returns 404 for an unknown task", async () => {
      const res = await request(app)
        .patch("/api/v1/tasks/nope/status")
        .send({ status: "DONE" });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/tasks/:id", () => {
    it("updates supplied fields", async () => {
      const created = await createTask({ title: "old" });
      const res = await request(app)
        .patch(`/api/v1/tasks/${created.id}`)
        .send({ title: "new title" });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("new title");
    });

    it("rejects an empty body with 400", async () => {
      const created = await createTask();
      const res = await request(app).patch(`/api/v1/tasks/${created.id}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/v1/tasks/:id", () => {
    it("returns 204 on success and removes the task", async () => {
      const created = await createTask();
      const del = await request(app).delete(`/api/v1/tasks/${created.id}`);
      expect(del.status).toBe(204);
      const after = await request(app).get(`/api/v1/tasks/${created.id}`);
      expect(after.status).toBe(404);
    });

    it("returns 404 when the task does not exist", async () => {
      const res = await request(app).delete("/api/v1/tasks/nope");
      expect(res.status).toBe(404);
    });
  });

  describe("Unknown routes", () => {
    it("returns a JSON 404 with the wire-format envelope", async () => {
      const res = await request(app).get("/no-such-route");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
      expect(res.headers["content-type"]).toMatch(/json/);
    });
  });
});
