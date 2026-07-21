import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { TaskControllers } from "./task.controllers";
import {
  createTaskValidator,
  updateTaskValidator,
  reorderTasksValidator,
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
router.get("/:taskId", TaskControllers.getTask);
router.patch("/:taskId", validatorMiddleware(updateTaskValidator), TaskControllers.updateTask);
router.delete("/:taskId", TaskControllers.deleteTask);

router.post("/:taskId/attachments", attachmentUpload, TaskControllers.addAttachments);
router.delete("/:taskId/attachments/:attachmentId", TaskControllers.removeAttachment);

router.post("/:taskId/share", TaskControllers.generateTaskShareLink);
router.post("/:taskId/banner", bannerUpload, TaskControllers.setBanner);
router.delete("/:taskId/banner", TaskControllers.removeBanner);

router.use("/:taskId/activity", ActivityLogRoutes);
router.use("/:taskId/comments", CommentRoutes);

export const TaskRoutes = router;

const teamTaskRouter = express.Router({ mergeParams: true });

teamTaskRouter.use(authMiddleware);

teamTaskRouter.get("/assigned-to-me", TaskControllers.getAssignedToMe);
teamTaskRouter.patch(
  "/reorder-assigned",
  validatorMiddleware(reorderTasksValidator),
  TaskControllers.reorderMemberTasks
);

export const TeamTaskRoutes = teamTaskRouter;
