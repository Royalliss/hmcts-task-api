import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { tasksRouter } from "./routes/tasks.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./lib/swagger.js";

export const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Tiny index so hitting the root in a browser returns something useful
// instead of the catch-all 404.
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "HMCTS Task API",
    docs: "/api-docs",
    health: "/health",
    tasks: "/api/v1/tasks",
  });
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API docs. Served at /api-docs with the spec available at /api-docs.json
// for any external tooling.
app.get("/api-docs.json", (_req: Request, res: Response) => {
  res.status(200).json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/v1/tasks", tasksRouter);

// 404 for anything unmatched, then central error handler. Order matters:
// notFoundHandler comes after all real routes; errorHandler is registered
// last so it receives errors from any earlier handler.
app.use(notFoundHandler);
app.use(errorHandler);
