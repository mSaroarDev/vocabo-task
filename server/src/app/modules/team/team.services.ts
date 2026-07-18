import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { User } from "../auth/auth.model";
import TeamModel from "./team.model";
import bot from "../auth/telegram.bot";
import WorkspaceModel from "../workspace/workspace.model";
import TaskModel from "../task/task.model";
import ColumnModel from "../column/column.model";
import { getStorage } from "../task/task.storage";

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
    .populate("members.user", "name email avatar")
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

const addMember = async (teamId: string, userId: string, email: string, role: string = "member") => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const requesterId = new Types.ObjectId(userId);
  const isOwner = team.owner.equals(requesterId);
  const isPM = team.members.some(
    (m) => m.user.equals(requesterId) && m.role === "project manager"
  );
  if (!isOwner && !isPM) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner or project managers can add members");
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
    role: role as "project manager" | "member" | "others",
    joinedAt: new Date(),
  });
  await team.save();

  if (targetUser.telegramConnected && targetUser.telegramChatId) {
    const performer = await User.findById(userId).select("name");
    try {
      await bot?.telegram.sendMessage(
        targetUser.telegramChatId,
        `🏷️ Team Invitation\n\nYou've been added to: ${team.name}\nAdded by: ${performer?.name || "Unknown"}`
      );
    } catch (error: any) {
      if (error?.response?.error_code === 403) {
        await User.findByIdAndUpdate(targetUserId, {
          telegramConnected: false,
          telegramChatId: null,
          telegramConnectToken: null,
          telegramUsername: null,
        });
      }
      console.error("Telegram notification error:", error);
    }
  }

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email avatar");
  return populated;
};

const removeMember = async (teamId: string, userId: string, memberUserId: string) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const requesterId = new Types.ObjectId(userId);
  const isOwner = team.owner.equals(requesterId);
  const isPM = team.members.some(
    (m) => m.user.equals(requesterId) && m.role === "project manager"
  );
  if (!isOwner && !isPM) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner or project managers can remove members");
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

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email avatar");
  return populated;
};

const updateMemberRole = async (
  teamId: string,
  userId: string,
  memberUserId: string,
  role: string
) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const requesterId = new Types.ObjectId(userId);
  const isOwner = team.owner.equals(requesterId);
  const isPM = team.members.some(
    (m) => m.user.equals(requesterId) && m.role === "project manager"
  );
  if (!isOwner && !isPM) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner or project managers can update member roles");
  }

  const targetId = new Types.ObjectId(memberUserId);
  if (team.owner.equals(targetId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Cannot change the team owner's role");
  }

  const member = team.members.find((m) => m.user.equals(targetId));
  if (!member) {
    throw new AppError(httpStatus.NOT_FOUND, "Member not found in this team");
  }

  member.role = role as "owner" | "project manager" | "member" | "others";
  await team.save();

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email avatar");
  return populated;
};

const deleteTeam = async (teamId: string, userId: string) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const ownerId = new Types.ObjectId(userId);
  if (!team.owner.equals(ownerId)) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner can delete the team");
  }

  // Cascade delete: workspaces, columns, tasks
  const workspaces = await WorkspaceModel.find({ team: team._id }).select("_id");
  const workspaceIds = workspaces.map((w) => w._id);

  if (workspaceIds.length > 0) {
    await TaskModel.deleteMany({ workspace: { $in: workspaceIds } });
    await ColumnModel.deleteMany({ workspace: { $in: workspaceIds } });
    await WorkspaceModel.deleteMany({ _id: { $in: workspaceIds } });
  }

  await TeamModel.findByIdAndDelete(teamId);

  return team;
};

const leaveTeam = async (teamId: string, userId: string) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const userObjectId = new Types.ObjectId(userId);

  if (team.owner.equals(userObjectId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Team owner cannot leave. Delete the team instead.");
  }

  const memberIndex = team.members.findIndex((m) => m.user.equals(userObjectId));
  if (memberIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a member of this team");
  }

  team.members.splice(memberIndex, 1);
  await team.save();

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email avatar");
  return populated;
};

const uploadAvatar = async (teamId: string, userId: string, file: Express.Multer.File) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const ownerId = new Types.ObjectId(userId);
  if (!team.owner.equals(ownerId)) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the team owner can update the avatar");
  }

  const storage = getStorage();
  let url: string;
  try {
    url = await storage.upload(file.path, file.filename, file.mimetype);
  } catch {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar");
  }

  if (!url.startsWith("http")) {
    url = `/uploads/team-avatars/${file.filename}`;
  }

  team.avatar = url;
  await team.save();

  const populated = await TeamModel.findById(team._id).populate("members.user", "name email avatar");
  return populated;
};

export const TeamServices = {
  createTeam,
  getMyTeams,
  joinTeam,
  addMember,
  removeMember,
  updateMemberRole,
  deleteTeam,
  leaveTeam,
  uploadAvatar,
};
