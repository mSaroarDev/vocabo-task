import { z } from "zod";

export const notificationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  type: z.string().optional(),
  grouped: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const markAllAsReadSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const unreadCountQuerySchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});
