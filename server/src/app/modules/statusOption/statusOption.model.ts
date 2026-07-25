import mongoose, { Schema } from "mongoose";
import { IStatusOption } from "./statusOption.interface";

const statusOptionSchema = new Schema<IStatusOption>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

statusOptionSchema.index({ workspace: 1, label: 1 }, { unique: true });
statusOptionSchema.index({ workspace: 1, order: 1 });

const StatusOptionModel = mongoose.model<IStatusOption>("StatusOption", statusOptionSchema);

export default StatusOptionModel;
