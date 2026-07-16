import { Types } from "mongoose";

export interface IComment {
  task: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
