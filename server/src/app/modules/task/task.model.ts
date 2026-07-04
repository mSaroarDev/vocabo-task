import { Schema, model } from "mongoose";
import type { ITask, IAttachment } from "./task.interface";

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    banner: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
    description: { type: String, trim: true },
    status: { type: String, required: true, default: "New", trim: true, maxlength: 80 },
    priority: {
      type: String,
      enum: ["None", "Low", "Medium", "High"],
      default: "None",
    },
    attachments: { type: [attachmentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    customFields: { type: Map, of: Schema.Types.Mixed, default: {} },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

taskSchema.index({ workspace: 1, order: 1 });
taskSchema.index({ workspace: 1, createdAt: -1 });

const TaskModel = model<ITask>("Task", taskSchema);

export default TaskModel;
