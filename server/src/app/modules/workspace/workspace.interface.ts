import { Types } from "mongoose";

export interface IWorkspace {
  name: string;
  icon: string;
  order: number;
  team: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
