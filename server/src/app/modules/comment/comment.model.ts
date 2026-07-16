import { Schema, model } from "mongoose";
import type { IComment } from "./comment.interface";

const commentSchema = new Schema<IComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true, versionKey: false }
);

const CommentModel = model<IComment>("Comment", commentSchema);

export default CommentModel;
