import { z } from "zod";

const createChecklistValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  id: z.string().trim().min(1, "Id is required"),
});

const updateChecklistValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
});

const reorderChecklistsValidator = z.object({
  ids: z
    .array(z.string().trim().min(1, "Checklist id is required"))
    .min(1, "Checklist order is required"),
});

const addItemValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(500, "Title is too long"),
  itemId: z.string().trim().min(1, "Item id is required"),
});

const updateItemValidator = z.object({
  title: z.string().trim().min(1, "Title is required").max(500, "Title is too long").optional(),
  checked: z.boolean().optional(),
});

const reorderItemsValidator = z.object({
  itemIds: z
    .array(z.string().trim().min(1, "Item id is required"))
    .min(1, "Item order is required"),
});

export {
  createChecklistValidator,
  updateChecklistValidator,
  reorderChecklistsValidator,
  addItemValidator,
  updateItemValidator,
  reorderItemsValidator,
};
