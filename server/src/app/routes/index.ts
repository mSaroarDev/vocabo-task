import express from "express";
import { SampleRoutes } from "../modules/sample/sample.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { TeamRoutes } from "../modules/team/team.routes";
import { WorkspaceRoutes } from "../modules/workspace/workspace.routes";
import { ColumnRoutes } from "../modules/column/column.routes";
import { TaskRoutes, TeamTaskRoutes } from "../modules/task/task.routes";
import { TaskControllers } from "../modules/task/task.controllers";
import { ChecklistRoutes } from "../modules/checklist/checklist.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { StickyNoteRoutes } from "../modules/stickyNote/stickyNote.routes";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

router.use("/sample", SampleRoutes);
router.use("/auth", AuthRoutes);
router.get("/tasks/share/:nanoid", TaskControllers.getSharedTask);
router.use("/teams", TeamRoutes);
router.use("/teams/:teamId/workspaces", WorkspaceRoutes);
router.use("/teams/:teamId/workspaces/:workspaceId/columns", ColumnRoutes);
router.use("/teams/:teamId/workspaces/:workspaceId/tasks", TaskRoutes);
router.use("/teams/:teamId/tasks", TeamTaskRoutes);
router.use("/checklist", ChecklistRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/sticky-notes", StickyNoteRoutes);

export default router;
