import { Schema, model } from "mongoose";
import type { IStickyNoteGroup, IStickyNote } from "./stickyNote.interface";

const stickyNoteGroupSchema = new Schema<IStickyNoteGroup>(
  {
    _id: { type: String },
    user: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, _id: false }
);

stickyNoteGroupSchema.index({ user: 1, order: 1 });

const stickyNoteSchema = new Schema<IStickyNote>(
  {
    _id: { type: String },
    user: { type: String, required: true },
    groupId: { type: String, required: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    color: { type: String, default: "#ffffff" },
    isPinned: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, _id: false }
);

stickyNoteSchema.index({ user: 1, groupId: 1, order: 1 });
stickyNoteSchema.index({ user: 1, groupId: 1, isPinned: -1, order: 1 });

const StickyNoteGroupModel = model<IStickyNoteGroup>("StickyNoteGroup", stickyNoteGroupSchema);
const StickyNoteModel = model<IStickyNote>("StickyNote", stickyNoteSchema);

export { StickyNoteGroupModel, StickyNoteModel };
