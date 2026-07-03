import { z } from "zod";

const createTaskValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.enum(["None", "Low", "Medium", "High"]).optional(),
  assignedTo: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const updateTaskValidator = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  banner: z.string().trim().optional(),
  isCompleted: z.boolean().optional(),
  description: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.enum(["None", "Low", "Medium", "High"]).optional(),
  assignedTo: z.string().nullable().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const reorderTasksValidator = z.object({
  taskIds: z
    .array(z.string())
    .min(1, "At least one task id is required")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      { message: "Task ids must be unique" }
    ),
});

export { createTaskValidator, updateTaskValidator, reorderTasksValidator };
