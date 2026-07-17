import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import NotificationModel from "./notification.model";

const createNotification = async (
  createdBy: string,
  payload: {
    title: string;
    body: string;
    type?: "task" | "comment" | "mention" | "system";
    recipientIds: string[];
    teamId?: string;
    workspaceId?: string;
    taskId?: string;
    imageUrl?: string;
  }
) => {
  const uniqueRecipientIds = [...new Set(payload.recipientIds)];

  const result = await NotificationModel.create({
    title: payload.title.trim(),
    body: payload.body.trim(),
    type: payload.type ?? "system",
    recipientIds: uniqueRecipientIds,
    seenBy: [],
    createdBy,
    teamId: payload.teamId,
    workspaceId: payload.workspaceId,
    taskId: payload.taskId,
    imageUrl: payload.imageUrl,
  });

  return result;
};

const getNotificationsByUser = async (userId: string) => {
  return NotificationModel.find({ recipientIds: { $in: [userId] } }).sort({ createdAt: -1 });
};

const markAsRead = async (userId: string, notificationId: string) => {
  const result = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipientIds: { $in: [userId] } },
    { $addToSet: { seenBy: userId } },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  return result;
};

const markAllAsRead = async (userId: string) => {
  await NotificationModel.updateMany(
    { recipientIds: { $in: [userId] }, seenBy: { $ne: userId } },
    { $addToSet: { seenBy: userId } }
  );

  return NotificationModel.find({ recipientIds: { $in: [userId] } }).sort({ createdAt: -1 });
};

export const NotificationServices = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
};
