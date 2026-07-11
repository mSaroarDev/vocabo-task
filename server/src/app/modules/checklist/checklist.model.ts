import { Schema, model } from "mongoose";
import type { IChecklist } from "./checklist.interface";

const checklistItemSchema = new Schema(
  {
    itemId: { type: String, required: true },
    title: { type: String, required: true },
    checked: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const checklistSchema = new Schema<IChecklist>(
  {
    _id: { type: String },
    user: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    items: [checklistItemSchema],
  },
  { timestamps: true, _id: false }
);

checklistSchema.index({ user: 1, order: 1 });

const ChecklistModel = model<IChecklist>("Checklist", checklistSchema);

export default ChecklistModel;
