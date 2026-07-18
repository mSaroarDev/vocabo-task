import { z } from "zod";

const createGroupValidator = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  id: z.string().trim().min(1, "Id is required"),
});

const renameGroupValidator = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
});

const reorderGroupsValidator = z.object({
  ids: z
    .array(z.string().trim().min(1, "Group id is required"))
    .min(1, "Group order is required"),
});

const createNoteValidator = z.object({
  groupId: z.string().trim().min(1, "Group id is required"),
  title: z.string().max(500, "Title is too long").default(""),
  content: z.string().default(""),
  color: z.string().default("#ffffff"),
  id: z.string().trim().min(1, "Note id is required"),
});

const updateNoteValidator = z.object({
  title: z.string().max(500, "Title is too long").optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
});

const reorderNotesValidator = z.object({
  groupId: z.string().trim().min(1, "Group id is required"),
  noteIds: z
    .array(z.string().trim().min(1, "Note id is required"))
    .min(1, "Note order is required"),
});

export {
  createGroupValidator,
  renameGroupValidator,
  reorderGroupsValidator,
  createNoteValidator,
  updateNoteValidator,
  reorderNotesValidator,
};
