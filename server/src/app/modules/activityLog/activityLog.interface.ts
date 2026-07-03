import { Types } from "mongoose";

export type ActivityAction = "created" | "updated" | "deleted";

export interface IActivityLog {
  task: Types.ObjectId;
  workspace: Types.ObjectId;
  team: Types.ObjectId;
  action: ActivityAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}
