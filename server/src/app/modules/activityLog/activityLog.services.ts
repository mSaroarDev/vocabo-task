import { Types } from "mongoose";
import ActivityLogModel from "./activityLog.model";
import type { ActivityAction } from "./activityLog.interface";

interface LogEntry {
  task: string;
  workspace: string;
  team: string;
  action: ActivityAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
}

const logActivity = async (entry: LogEntry) => {
  return ActivityLogModel.create({
    task: new Types.ObjectId(entry.task),
    workspace: new Types.ObjectId(entry.workspace),
    team: new Types.ObjectId(entry.team),
    action: entry.action,
    field: entry.field || undefined,
    oldValue: entry.oldValue || undefined,
    newValue: entry.newValue || undefined,
    performedBy: new Types.ObjectId(entry.performedBy),
  });
};

const getTaskActivity = async (taskId: string) => {
  if (!Types.ObjectId.isValid(taskId)) {
    return [];
  }
  return ActivityLogModel.find({ task: taskId })
    .sort({ createdAt: -1 })
    .populate("performedBy", "name email avatar");
};

export const ActivityLogServices = {
  logActivity,
  getTaskActivity,
};
