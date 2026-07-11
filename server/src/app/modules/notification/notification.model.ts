import { Schema, model } from "mongoose";
import type { INotification, NotificationType } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorAvatar: { type: String, default: null },
    type: {
      type: String,
      enum: [
        "WORKSPACE_CREATED",
        "WORKSPACE_UPDATED",
        "WORKSPACE_ARCHIVED",
        "MEMBER_INVITED",
        "MEMBER_JOINED",
        "MEMBER_REMOVED",
        "ROLE_CHANGED",
        "TASK_CREATED",
        "TASK_UPDATED",
        "TASK_DELETED",
        "TASK_ASSIGNED",
        "TASK_UNASSIGNED",
        "TASK_COMPLETED",
        "TASK_REOPENED",
        "TASK_STATUS_CHANGED",
        "TASK_PRIORITY_CHANGED",
        "DUE_DATE_CHANGED",
        "TASK_MOVED",
        "TASK_RESTORED",
        "LIST_CREATED",
        "LIST_RENAMED",
        "LIST_DELETED",
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "PROJECT_ARCHIVED",
        "COMMENT_ADDED",
        "COMMENT_EDITED",
        "COMMENT_DELETED",
        "FILE_UPLOADED",
        "ATTACHMENT_REMOVED",
        "LABEL_CREATED",
        "LABEL_DELETED",
        "LABEL_ASSIGNED",
        "LABEL_REMOVED",
      ] satisfies NotificationType[],
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isSystem: { type: Boolean, default: false },
    recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ workspaceId: 1, createdAt: -1 });
notificationSchema.index({ workspaceId: 1, readBy: 1 });
notificationSchema.index({ actorId: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });

const NotificationModel = model<INotification>("Notification", notificationSchema);

export default NotificationModel;
