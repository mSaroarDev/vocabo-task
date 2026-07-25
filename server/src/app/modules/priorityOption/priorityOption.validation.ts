import { z } from "zod";

const createPriorityOptionValidator = z.object({
  label: z.string().trim().min(1, "Priority label is required").max(80, "Priority label is too long"),
  color: z.string().trim().min(1, "Priority color is required"),
});

const updatePriorityOptionValidator = z.object({
  label: z.string().trim().min(1, "Priority label is required").max(80, "Priority label is too long").optional(),
  color: z.string().trim().min(1, "Priority color is required").optional(),
});

const reorderPriorityOptionsValidator = z.object({
  optionIds: z.array(z.string()).min(1, "At least one option id is required"),
});

export { createPriorityOptionValidator, updatePriorityOptionValidator, reorderPriorityOptionsValidator };
