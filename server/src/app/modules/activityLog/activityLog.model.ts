import { Schema, model } from "mongoose";
import type { IActivityLog } from "./activityLog.interface";

const activityLogSchema = new Schema<IActivityLog>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    action: {
      type: String,
      enum: ["created", "updated", "deleted"],
      required: true,
    },
    field: { type: String, default: null },
    oldValue: { type: String, default: null },
    newValue: { type: String, default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ task: 1, createdAt: -1 });

const ActivityLogModel = model<IActivityLog>("ActivityLog", activityLogSchema);

export default ActivityLogModel;
