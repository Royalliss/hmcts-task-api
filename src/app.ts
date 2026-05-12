import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";

export const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes will be mounted here later
// app.use("/api/v1/tasks", tasksRouter);

// 404 and error handlers will be mounted here