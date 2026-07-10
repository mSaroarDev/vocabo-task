import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import { NotificationControllers } from "./notification.controllers";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", NotificationControllers.getNotifications);

export const NotificationRoutes = router;

const globalRouter = express.Router();

globalRouter.use(authMiddleware);

globalRouter.get("/unread-count", NotificationControllers.getUnreadCount);
globalRouter.post("/read-all", NotificationControllers.markAllAsRead);
globalRouter.post("/:id/read", NotificationControllers.markAsRead);

export const NotificationGlobalRoutes = globalRouter;
