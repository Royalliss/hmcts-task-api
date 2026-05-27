import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors.js";

// Single-shot validation middleware. The schema validates the whole shape
// { body, params, query } and we write the parsed (and transformed) values
// back to req so downstream handlers see Date objects instead of strings.
//
// We use ZodType<unknown> rather than ZodObject so this middleware works
// for any wrapper shape (e.g. body-only, params-only).
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return next(new ValidationError("Request validation failed", details));
    }
    const parsed = result.data as { body?: unknown; params?: unknown; query?: unknown };
    if (parsed.body !== undefined) req.body = parsed.body;
    // req.params and req.query in Express 5 are read-only getters - we don't
    // need to overwrite them since the schema-validated values match what
    // Express already parsed (ids are strings, query strings are strings).
    next();
  };
}
