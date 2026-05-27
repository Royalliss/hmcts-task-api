import type { Request, Response, NextFunction } from "express";
import { tasksService } from "../services/tasks.service.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "../schemas/task.schemas.js";

// Controllers do one thing: pull the validated input off the request, call
// the service, shape the HTTP response. They never talk to Prisma directly
// and never construct domain error responses - they delegate to next() and
// let the central error handler take it.

export const tasksController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await tasksService.list();
      res.status(200).json({ data: tasks });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.getById(req.params.id as string);
      res.status(200).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateTaskInput;
      const task = await tasksService.create(input);
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateTaskInput;
      const task = await tasksService.update(req.params.id as string, input);
      res.status(200).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateTaskStatusInput;
      const task = await tasksService.updateStatus(req.params.id as string, input);
      res.status(200).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await tasksService.remove(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
