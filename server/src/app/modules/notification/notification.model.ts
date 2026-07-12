import { Schema, model } from "mongoose";
import type { INotification, NotificationType } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["task", "comment", "mention", "system"],
      default: "system",
    },
    recipientIds: {
      type: [String],
      required: true,
      default: [],
    },
    seenBy: {
      type: [String],
      default: [],
    },
    createdBy: { type: String },
    teamId: { type: String },
    workspaceId: { type: String },
    taskId: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientIds: 1, createdAt: -1 });
notificationSchema.index({ seenBy: 1 });

const NotificationModel = model<INotification>("Notification", notificationSchema);

export default NotificationModel;
