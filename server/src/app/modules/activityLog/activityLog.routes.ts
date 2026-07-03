import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import { ActivityLogControllers } from "./activityLog.controllers";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", ActivityLogControllers.getTaskActivity);

export const ActivityLogRoutes = router;
