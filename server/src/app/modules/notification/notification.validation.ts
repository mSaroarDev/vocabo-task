import { z } from "zod";

const createNotificationValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  body: z.string().trim().min(1, "Body is required").max(1000, "Body is too long"),
  type: z.enum(["task", "comment", "mention", "system"]).optional(),
  recipientIds: z
    .array(z.string().trim().min(1, "Recipient id is required"))
    .min(1, "At least one recipient is required"),
  teamId: z.string().trim().min(1).optional(),
  workspaceId: z.string().trim().min(1).optional(),
  taskId: z.string().trim().min(1).optional(),
});

export { createNotificationValidator };
