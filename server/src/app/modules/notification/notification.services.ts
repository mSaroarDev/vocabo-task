import { Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import NotificationModel from "./notification.model";
import type {
  INotification,
  LogNotificationParams,
  NotificationType,
} from "./notification.interface";

let io: any = null;

export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

const emitToWorkspace = (workspaceId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
};

const log = async (params: LogNotificationParams): Promise<INotification> => {
  const notification = await NotificationModel.create({
    workspaceId: new Types.ObjectId(params.workspaceId),
    teamId: new Types.ObjectId(params.teamId),
    actorId: new Types.ObjectId(params.actorId),
    actorName: params.actorName,
    actorAvatar: params.actorAvatar || undefined,
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    title: params.title,
    description: params.description,
    metadata: params.metadata || {},
    isSystem: params.isSystem || false,
  });

  const populated = await notification.populate("actorId", "name email avatar");

  emitToWorkspace(params.workspaceId, "notification:new", populated);
  emitToWorkspace(params.workspaceId, "notification:unread-count", {});

  return populated;
};

interface GetNotificationsOptions {
  workspaceId: string;
  page?: number;
  limit?: number;
  type?: NotificationType;
  grouped?: boolean;
}

const getNotifications = async (
  userId: string,
  options: GetNotificationsOptions
) => {
  const { workspaceId, page = 1, limit = 20, type, grouped } = options;

  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  if (grouped) {
    const match: Record<string, unknown> = { workspaceId: new Types.ObjectId(workspaceId) };
    if (type) match.type = type;

    const result = await NotificationModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { actorId: "$actorId", type: "$type" },
          actorName: { $first: "$actorName" },
          actorAvatar: { $first: "$actorAvatar" },
          count: { $sum: 1 },
          latestTimestamp: { $max: "$createdAt" },
          entityType: { $first: "$entityType" },
          sampleTitle: { $first: "$title" },
        },
      },
      { $sort: { latestTimestamp: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const totalResult = await NotificationModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { actorId: "$actorId", type: "$type" },
        },
      },
      { $count: "count" },
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  const filter: Record<string, unknown> = {
    workspaceId: new Types.ObjectId(workspaceId),
  };
  if (type) filter.type = type;

  const [data, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actorId", "name email avatar")
      .lean(),
    NotificationModel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

const getUnreadCount = async (workspaceId: string, userId: string) => {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  const count = await NotificationModel.countDocuments({
    workspaceId: new Types.ObjectId(workspaceId),
    readBy: { $ne: new Types.ObjectId(userId) },
  });

  return count;
};

const markAllAsRead = async (workspaceId: string, userId: string) => {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  await NotificationModel.updateMany(
    {
      workspaceId: new Types.ObjectId(workspaceId),
      readBy: { $ne: new Types.ObjectId(userId) },
    },
    { $push: { readBy: new Types.ObjectId(userId) } }
  );

  const count = await NotificationModel.countDocuments({
    workspaceId: new Types.ObjectId(workspaceId),
    readBy: { $ne: new Types.ObjectId(userId) },
  });

  emitToWorkspace(workspaceId, "notification:unread-count", { count });

  return true;
};

const markAsRead = async (notificationId: string, userId: string) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid notification id");
  }

  const notification = await NotificationModel.findByIdAndUpdate(
    notificationId,
    { $addToSet: { readBy: new Types.ObjectId(userId) } },
    { new: true }
  );

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  return notification;
};

export const NotificationServices = {
  log,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
};
