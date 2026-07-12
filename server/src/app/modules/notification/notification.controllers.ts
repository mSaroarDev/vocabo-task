import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { NotificationServices } from "./notification.services";

const getUserId = (req: AuthRequest) => req.user!.id;
const getNotificationId = (req: Request) => req.params.notificationId as string;

const createNotification: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.createNotification(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Notification created successfully",
    data: result,
  });
});

const getNotifications: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.getNotificationsByUser(getUserId(req as AuthRequest));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const markAsRead: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.markAsRead(
    getUserId(req as AuthRequest),
    getNotificationId(req)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.markAllAsRead(getUserId(req as AuthRequest));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
});

export const NotificationControllers = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
