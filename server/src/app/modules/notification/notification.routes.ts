import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { NotificationControllers } from "./notification.controllers";
import { createNotificationValidator } from "./notification.validation";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validatorMiddleware(createNotificationValidator), NotificationControllers.createNotification);
router.get("/", NotificationControllers.getNotifications);
router.patch("/read-all", NotificationControllers.markAllAsRead);
router.patch("/:notificationId/read", NotificationControllers.markAsRead);

export const NotificationRoutes = router;
