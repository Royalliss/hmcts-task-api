/**
 * Domain errors. Throw these from services / controllers; the central error
 * handler in src/middleware/errorHandler.ts turns them into the wire format
 *   { error: { code, message, details? } }
 *
 * Keeping error construction inside the domain (rather than every controller
 * hand-rolling res.status(404).json(...)) means the wire shape and HTTP
 * status mapping live in exactly one place.
 */

export type ErrorDetails = unknown;

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ErrorDetails;

  constructor(status: number, code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} with id '${id}' was not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}
