import { Types } from "mongoose";

export type TaskPriority = "None" | "Lowest" | "Low" | "Medium" | "High" | "Highest";

export interface IAttachment {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask {
  workspace: Types.ObjectId;
  title: string;
  banner?: string;
  isCompleted: boolean;
  description?: string;
  status: string;
  priority: TaskPriority;
  attachments: IAttachment[];
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  customFields: Map<string, unknown>;
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
