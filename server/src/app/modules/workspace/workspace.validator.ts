import { z } from "zod";

const workspaceName = z
  .string()
  .trim()
  .min(2, "Workspace name must be at least 2 characters")
  .max(80, "Workspace name is too long");

const createWorkspaceValidator = z.object({
  name: workspaceName,
  icon: z.string().trim().max(40, "Workspace icon is too long").optional(),
  color: z.string().trim().max(7, "Workspace color is too long").optional(),
});

const updateWorkspaceValidator = z.object({
  name: workspaceName.optional(),
  icon: z.string().trim().max(40, "Workspace icon is too long").optional(),
  color: z.string().trim().max(7, "Workspace color is too long").optional(),
});

const reorderWorkspacesValidator = z.object({
  workspaceIds: z
    .array(z.string().trim().min(1, "Workspace id is required"))
    .min(1, "Workspace order is required"),
});

export { createWorkspaceValidator, updateWorkspaceValidator, reorderWorkspacesValidator };
