import { Types } from "mongoose";

export interface IColumn {
  workspace: Types.ObjectId;
  key: string;
  label: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_COLUMN_SEED: Array<{ key: string; label: string }> = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "isCompleted", label: "Done" },
  { key: "description", label: "Description" },
  { key: "assignee", label: "Assigned To" },
  { key: "createdBy", label: "Created By" },
];
