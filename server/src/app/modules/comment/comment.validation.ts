import { z } from "zod";

export const createCommentValidator = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

export type CreateCommentInput = z.infer<typeof createCommentValidator>;
