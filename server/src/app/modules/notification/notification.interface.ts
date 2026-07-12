export type NotificationType = "task" | "comment" | "mention" | "system";

export interface INotification {
  title: string;
  body: string;
  type: NotificationType;
  recipientIds: string[];
  seenBy: string[];
  createdBy?: string;
  teamId?: string;
  workspaceId?: string;
  taskId?: string;
}
