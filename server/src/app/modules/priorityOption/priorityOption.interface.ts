import { Types } from "mongoose";

export interface IPriorityOption {
  workspace: Types.ObjectId;
  team: Types.ObjectId;
  label: string;
  color: string;
  order: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PRIORITY_OPTIONS: Array<{ label: string; color: string }> = [
  { label: "None", color: "bg-zinc-600/20 text-zinc-300" },
  { label: "Lowest", color: "bg-blue-500/20 text-blue-300" },
  { label: "Low", color: "bg-sky-500/20 text-sky-300" },
  { label: "Medium", color: "bg-amber-500/20 text-amber-300" },
  { label: "High", color: "bg-orange-500/20 text-orange-300" },
  { label: "Highest", color: "bg-red-500/20 text-red-300" },
];
