import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors.js";

interface ErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Central error handler. Express 5 forwards rejected promises here too, so
// controllers can rely on next(err) being the only escape hatch.
//
// We intentionally don't leak internal error messages to clients in
// production - "Internal server error" is the user-facing message, the real
// one is logged.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const payload: ErrorPayload = {
      error: { code: err.code, message: err.message },
    };
    if (err.details !== undefined) payload.error.details = err.details;
    return res.status(err.status).json(payload);
  }

  const message = err instanceof Error ? err.message : String(err);
  if (process.env.NODE_ENV !== "test") {
    console.error("Unhandled error:", message, err);
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  } satisfies ErrorPayload);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  } satisfies ErrorPayload);
}
