import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { User } from "../auth/auth.model";
import TeamModel from "./team.model";

const createInviteCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const createUniqueInviteCode = async () => {
  let inviteCode = createInviteCode();
  let existingTeam = await TeamModel.exists({ inviteCode });

  while (existingTeam) {
    inviteCode = createInviteCode();
    existingTeam = await TeamModel.exists({ inviteCode });
  }

  return inviteCode;
};

const createTeam = async (userId: string, payload: { name: string }) => {
  const ownerId = new Types.ObjectId(userId);
  const inviteCode = await createUniqueInviteCode();

  const result = await TeamModel.create({
    name: payload.name.trim(),
    inviteCode,
    owner: ownerId,
    members: [
      {
        user: ownerId,
        role: "owner",
        joinedAt: new Date(),
      },
    ],
  });

  return result;
};

const getMyTeams = async (userId: string) => {
  const result = await TeamModel.find({ "members.user": userId })
    .populate("members.user", "name email")
    .sort({ createdAt: -1 });
  return result;
};

const joinTeam = async (userId: string, payload: { inviteCode: string }) => {
  const inviteCode = payload.inviteCode.trim().toUpperCase();
  const team = await TeamModel.findOne({ inviteCode });

  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team invite code is invalid");
  }

  const userObjectId = new Types.ObjectId(userId);
  const alreadyMember = team.members.some((member) => member.user.equals(userObjectId));

  if (!alreadyMember) {
    team.members.push({
      user: userObjectId,
      role: "member",
      joinedAt: new Date(),
    });
    await team.save();
  }

  return team;
};

const addMember = async (teamId: string, userId: string, email: string) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const ownerId = new Types.ObjectId(userId);
  if (!team.owner.equals(ownerId)) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner can add members");
  }

  const targetUser = await User.findOne({ email });
  if (!targetUser) {
    throw new AppError(httpStatus.NOT_FOUND, "No user found with that email");
  }

  const targetUserId = targetUser._id as Types.ObjectId;
  const alreadyMember = team.members.some((member) => member.user.equals(targetUserId));
  if (alreadyMember) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already a member of this team");
  }

  team.members.push({
    user: targetUserId,
    role: "member",
    joinedAt: new Date(),
  });
  await team.save();

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email");
  return populated;
};

const removeMember = async (teamId: string, userId: string, memberUserId: string) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const ownerId = new Types.ObjectId(userId);
  if (!team.owner.equals(ownerId)) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner can remove members");
  }

  const targetId = new Types.ObjectId(memberUserId);
  if (team.owner.equals(targetId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Cannot remove the team owner");
  }

  const memberIndex = team.members.findIndex((m) => m.user.equals(targetId));
  if (memberIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Member not found in this team");
  }

  team.members.splice(memberIndex, 1);
  await team.save();

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email");
  return populated;
};

export const TeamServices = {
  createTeam,
  getMyTeams,
  joinTeam,
  addMember,
  removeMember,
};
