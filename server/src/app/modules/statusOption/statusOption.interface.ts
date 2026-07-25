import { Types } from "mongoose";

export interface IStatusOption {
  workspace: Types.ObjectId;
  team: Types.ObjectId;
  label: string;
  color: string;
  order: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_STATUS_OPTIONS: Array<{ label: string; color: string }> = [
  { label: "New", color: "bg-purple-500/20 text-purple-300" },
  { label: "In progress", color: "bg-sky-500/20 text-sky-300" },
  { label: "In review", color: "bg-blue-600/20 text-blue-300" },
  { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
  { label: "Need info", color: "bg-yellow-500/20 text-yellow-300" },
  { label: "Done", color: "bg-green-600/20 text-green-300" },
  { label: "Duplicate", color: "bg-slate-600/20 text-slate-300" },
  { label: "Invalid", color: "bg-red-600/20 text-red-300" },
  { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
  { label: "PR Raised", color: "bg-rose-500/20 text-rose-300" },
  { label: "Ready for Test", color: "bg-emerald-500/20 text-emerald-300" },
  { label: "Need Approval", color: "bg-violet-500/20 text-violet-300" },
];
