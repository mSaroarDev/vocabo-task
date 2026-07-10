import { Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { NotificationServices } from "./notification.services";
import type { NotificationType } from "./notification.interface";

const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const type = (req.query.type as string) as NotificationType | undefined;
  const grouped = req.query.grouped === "true";

  const result = await NotificationServices.getNotifications(req.user!.id, {
    workspaceId,
    page,
    limit,
    type: type || undefined,
    grouped,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const workspaceId = req.query.workspaceId as string;

  if (!workspaceId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Workspace ID is required",
    });
    return;
  }

  const count = await NotificationServices.getUnreadCount(workspaceId, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread count retrieved",
    data: { count },
  });
});

const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.body;

  if (!workspaceId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Workspace ID is required",
    });
    return;
  }

  await NotificationServices.markAllAsRead(workspaceId, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read",
  });
});

const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const notification = await NotificationServices.markAsRead(id, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

export const NotificationControllers = {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
};
