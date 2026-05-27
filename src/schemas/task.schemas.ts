import { z } from "zod";

// Status values must match the Prisma TaskStatus enum exactly. We declare the
// union here (rather than importing from @prisma/client) so Zod owns the
// runtime validation surface and Prisma owns the generated types - they
// happen to overlap but the responsibility is split cleanly.
export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatusInput = z.infer<typeof taskStatusEnum>;

// ISO 8601 datetime. z.iso.datetime() is strict (no spaces, requires the T
// separator) which is what we want for a JSON API. We then coerce to Date so
// the service layer never deals with strings.
const isoDate = z.iso.datetime({ offset: true }).transform((s) => new Date(s));

const titleField = z
  .string()
  .trim()
  .min(1, "title is required")
  .max(255, "title must be 255 characters or fewer");

// Create: description is optional and we coerce undefined / "" to null so
// the column always holds either text or NULL (not undefined).
const descriptionField = z
  .string()
  .trim()
  .max(2000, "description must be 2000 characters or fewer")
  .nullish()
  .transform((v) => (v === "" ? null : v ?? null));

// Update: description must round-trip undefined as undefined so the
// "at least one field provided" refine below can distinguish "user omitted
// it" from "user explicitly set it to null".
const updateDescriptionField = z
  .string()
  .trim()
  .max(2000, "description must be 2000 characters or fewer")
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  body: z.object({
    title: titleField,
    description: descriptionField,
    status: taskStatusEnum.optional(),
    dueDate: isoDate,
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: taskStatusEnum,
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

// Full-update / partial-update of any subset of editable fields. .refine
// rejects the empty body so we don't silently no-op a PATCH.
export const updateTaskSchema = z.object({
  body: z
    .object({
      title: titleField.optional(),
      description: updateDescriptionField,
      status: taskStatusEnum.optional(),
      dueDate: isoDate.optional(),
    })
    .refine((v) => Object.values(v).some((x) => x !== undefined), {
      message: "request body must include at least one field to update",
    }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>["body"];
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>["body"];
