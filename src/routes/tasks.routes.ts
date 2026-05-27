import { Router } from "express";
import { tasksController } from "../controllers/tasks.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  idParamSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../schemas/task.schemas.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required: [id, title, status, dueDate, createdAt, updatedAt]
 *       properties:
 *         id: { type: string, example: ckv7y3kqj0000abc123def456 }
 *         title: { type: string, example: "Review bundle for case CR-2026-00412" }
 *         description: { type: string, nullable: true }
 *         status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *         dueDate: { type: string, format: date-time }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code: { type: string }
 *             message: { type: string }
 *             details: { type: object, nullable: true }
 *     CreateTaskBody:
 *       type: object
 *       required: [title, dueDate]
 *       properties:
 *         title: { type: string }
 *         description: { type: string, nullable: true }
 *         status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *         dueDate: { type: string, format: date-time }
 *     UpdateTaskStatusBody:
 *       type: object
 *       required: [status]
 *       properties:
 *         status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 */

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List all tasks
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTaskBody' }
 *     responses:
 *       201:
 *         description: Created task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", tasksController.list);
router.post("/", validate(createTaskSchema), tasksController.create);

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a single task by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The task }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *   patch:
 *     tags: [Tasks]
 *     summary: Update fields on a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTaskBody' }
 *     responses:
 *       200: { description: Updated task }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       404: { description: Not found }
 */
router.get("/:id", validate(idParamSchema), tasksController.getById);
router.patch("/:id", validate(updateTaskSchema), tasksController.update);
router.delete("/:id", validate(idParamSchema), tasksController.remove);

/**
 * @openapi
 * /api/v1/tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update only the status of a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTaskStatusBody' }
 *     responses:
 *       200: { description: Updated task }
 *       400: { description: Validation error }
 *       404: { description: Not found }
 */
router.patch("/:id/status", validate(updateTaskStatusSchema), tasksController.updateStatus);

export { router as tasksRouter };
