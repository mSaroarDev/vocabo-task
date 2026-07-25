import { z } from "zod";

const createStatusOptionValidator = z.object({
  label: z.string().trim().min(1, "Status label is required").max(80, "Status label is too long"),
  color: z.string().trim().min(1, "Status color is required"),
});

const updateStatusOptionValidator = z.object({
  label: z.string().trim().min(1, "Status label is required").max(80, "Status label is too long").optional(),
  color: z.string().trim().min(1, "Status color is required").optional(),
});

const reorderStatusOptionsValidator = z.object({
  optionIds: z.array(z.string()).min(1, "At least one option id is required"),
});

export { createStatusOptionValidator, updateStatusOptionValidator, reorderStatusOptionsValidator };
