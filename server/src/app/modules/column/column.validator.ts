import { z } from "zod";

const replaceColumnsValidator = z.object({
  columns: z
    .array(
      z.object({
        key: z.string().trim().min(1, "Column key is required").max(80, "Column key is too long"),
        label: z.string().trim().min(1, "Column label is required").max(80, "Column label is too long"),
      })
    )
    .min(1, "At least one column is required")
    .max(50, "Too many columns")
    .refine(
      (columns) => new Set(columns.map((c) => c.key)).size === columns.length,
      { message: "Column keys must be unique" }
    ),
});

export { replaceColumnsValidator };
