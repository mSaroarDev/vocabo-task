import mongoose, { Schema } from "mongoose";
import { IColumn } from "./column.interface";

const columnSchema = new Schema<IColumn>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

columnSchema.index({ workspace: 1, order: 1 });
columnSchema.index({ workspace: 1, key: 1 }, { unique: true });

const ColumnModel = mongoose.model<IColumn>("Column", columnSchema);

export default ColumnModel;
