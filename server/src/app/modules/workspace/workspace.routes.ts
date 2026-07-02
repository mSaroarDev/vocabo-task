import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { WorkspaceControllers } from "./workspace.controllers";
import {
  createWorkspaceValidator,
  reorderWorkspacesValidator,
  updateWorkspaceValidator,
} from "./workspace.validator";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", WorkspaceControllers.getTeamWorkspaces);
router.post("/", validatorMiddleware(createWorkspaceValidator), WorkspaceControllers.createWorkspace);
router.patch(
  "/reorder",
  validatorMiddleware(reorderWorkspacesValidator),
  WorkspaceControllers.reorderWorkspaces
);
router.patch(
  "/:workspaceId",
  validatorMiddleware(updateWorkspaceValidator),
  WorkspaceControllers.updateWorkspace
);
router.delete("/:workspaceId", WorkspaceControllers.deleteWorkspace);

export const WorkspaceRoutes = router;
