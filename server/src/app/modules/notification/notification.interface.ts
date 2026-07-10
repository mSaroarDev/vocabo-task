import { Types } from "mongoose";

export type NotificationType =
  | "WORKSPACE_CREATED"
  | "WORKSPACE_UPDATED"
  | "WORKSPACE_ARCHIVED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "ROLE_CHANGED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_ASSIGNED"
  | "TASK_UNASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_REOPENED"
  | "TASK_STATUS_CHANGED"
  | "TASK_PRIORITY_CHANGED"
  | "DUE_DATE_CHANGED"
  | "TASK_MOVED"
  | "TASK_RESTORED"
  | "LIST_CREATED"
  | "LIST_RENAMED"
  | "LIST_DELETED"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_ARCHIVED"
  | "COMMENT_ADDED"
  | "COMMENT_EDITED"
  | "COMMENT_DELETED"
  | "FILE_UPLOADED"
  | "ATTACHMENT_REMOVED"
  | "LABEL_CREATED"
  | "LABEL_DELETED"
  | "LABEL_ASSIGNED"
  | "LABEL_REMOVED";

export interface INotification {
  workspaceId: Types.ObjectId;
  teamId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorName: string;
  actorAvatar?: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  isSystem: boolean;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LogNotificationParams {
  workspaceId: string;
  teamId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  isSystem?: boolean;
}

export interface NotificationQueryParams {
  workspaceId: string;
  page?: number;
  limit?: number;
  type?: NotificationType;
}

export interface GroupedNotification {
  _id: {
    actorId: string;
    type: NotificationType;
  };
  actorName: string;
  actorAvatar?: string;
  count: number;
  latestTimestamp: Date;
  entityType: string;
  sampleTitle: string;
}
