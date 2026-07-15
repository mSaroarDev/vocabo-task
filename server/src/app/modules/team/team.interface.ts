import { Types } from "mongoose";

export type TeamRole = "owner" | "project manager" | "member" | "others";

export interface ITeamMember {
  user: Types.ObjectId;
  role: TeamRole;
  joinedAt: Date;
}

export interface ITeam {
  name: string;
  inviteCode: string;
  owner: Types.ObjectId;
  members: ITeamMember[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
