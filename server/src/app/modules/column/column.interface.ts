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
  { key: "name", label: "Task Name" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "attachFile", label: "Attach File" },
  { key: "createdBy", label: "Created By" },
  { key: "assignedTo", label: "Assigned To" },
];
