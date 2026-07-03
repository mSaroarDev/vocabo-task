import express from "express";
import { SampleRoutes } from "../modules/sample/sample.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { TeamRoutes } from "../modules/team/team.routes";
import { WorkspaceRoutes } from "../modules/workspace/workspace.routes";
import { ColumnRoutes } from "../modules/column/column.routes";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

router.use("/sample", SampleRoutes);
router.use("/auth", AuthRoutes);
router.use("/teams", TeamRoutes);
router.use("/teams/:teamId/workspaces", WorkspaceRoutes);
router.use("/teams/:teamId/workspaces/:workspaceId/columns", ColumnRoutes);

export default router;
