import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { TaskControllers } from "./task.controllers";
import {
  createTaskValidator,
  updateTaskValidator,
  reorderTasksValidator,
  swapTaskValidator,
} from "./task.validation";
import { attachmentUpload, bannerUpload } from "./task.upload";
import { ActivityLogRoutes } from "../activityLog/activityLog.routes";
import { CommentRoutes } from "../comment/comment.routes";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", TaskControllers.getTasks);
router.post("/", validatorMiddleware(createTaskValidator), TaskControllers.createTask);
router.patch(
  "/reorder",
  validatorMiddleware(reorderTasksValidator),
  TaskControllers.reorderTasks
);

router.patch("/archive", TaskControllers.archiveTasks);
router.get("/:uuid", TaskControllers.getTask);
router.patch("/:uuid", validatorMiddleware(updateTaskValidator), TaskControllers.updateTask);
router.delete("/:uuid", TaskControllers.deleteTask);

router.post("/:uuid/attachments", attachmentUpload, TaskControllers.addAttachments);
router.delete("/:uuid/attachments/:attachmentId", TaskControllers.removeAttachment);

router.post("/:uuid/share", TaskControllers.generateTaskShareLink);
router.post("/:uuid/banner", bannerUpload, TaskControllers.setBanner);
router.delete("/:uuid/banner", TaskControllers.removeBanner);

router.use("/:uuid/activity", ActivityLogRoutes);
router.use("/:uuid/comments", CommentRoutes);

export const TaskRoutes = router;

const teamTaskRouter = express.Router({ mergeParams: true });

teamTaskRouter.use(authMiddleware);

teamTaskRouter.get("/assigned-to-me", TaskControllers.getAssignedToMe);
teamTaskRouter.patch(
  "/reorder-assigned",
  validatorMiddleware(reorderTasksValidator),
  TaskControllers.reorderMemberTasks
);

teamTaskRouter.patch(
  "/:uuid/swap",
  validatorMiddleware(swapTaskValidator),
  TaskControllers.swapTaskWorkspace
);

export const TeamTaskRoutes = teamTaskRouter;
