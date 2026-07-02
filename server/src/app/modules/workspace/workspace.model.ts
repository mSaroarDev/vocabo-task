import mongoose, { Schema } from "mongoose";
import { IWorkspace } from "./workspace.interface";

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    icon: {
      type: String,
      default: "briefcase",
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

workspaceSchema.index({ team: 1, order: 1 });

const WorkspaceModel = mongoose.model<IWorkspace>("Workspace", workspaceSchema);

export default WorkspaceModel;
