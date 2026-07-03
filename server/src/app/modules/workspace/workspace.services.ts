import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import { seedDefaultColumns } from "../column/column.services";
import WorkspaceModel from "./workspace.model";

const ensureTeamMember = async (teamId: string, userId: string) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team id");
  }

  const team = await TeamModel.findOne({
    _id: teamId,
    "members.user": userId,
  });

  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  return team;
};

const getTeamWorkspaces = async (teamId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);
  const result = await WorkspaceModel.find({ team: teamId }).sort({ order: 1, createdAt: 1 });
  return result;
};

const createWorkspace = async (
  teamId: string,
  userId: string,
  payload: { name: string; icon?: string }
) => {
  await ensureTeamMember(teamId, userId);
  const lastWorkspace = await WorkspaceModel.findOne({ team: teamId }).sort({ order: -1 });

  const result = await WorkspaceModel.create({
    name: payload.name.trim(),
    icon: payload.icon?.trim() || "briefcase",
    order: lastWorkspace ? lastWorkspace.order + 1 : 0,
    team: new Types.ObjectId(teamId),
    createdBy: new Types.ObjectId(userId),
  });

  await seedDefaultColumns(result._id);

  return result;
};

const updateWorkspace = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: { name?: string; icon?: string }
) => {
  await ensureTeamMember(teamId, userId);

  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  const updatePayload = {
    ...(payload.name ? { name: payload.name.trim() } : {}),
    ...(payload.icon ? { icon: payload.icon.trim() } : {}),
  };

  const result = await WorkspaceModel.findOneAndUpdate(
    { _id: workspaceId, team: teamId },
    updatePayload,
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");
  }

  return result;
};

const reorderWorkspaces = async (
  teamId: string,
  userId: string,
  payload: { workspaceIds: string[] }
) => {
  await ensureTeamMember(teamId, userId);

  if (payload.workspaceIds.some((workspaceId) => !Types.ObjectId.isValid(workspaceId))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  const uniqueWorkspaceIds = [...new Set(payload.workspaceIds)];
  if (uniqueWorkspaceIds.length !== payload.workspaceIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Workspace order contains duplicates");
  }

  const [teamWorkspaceCount, matchingCount] = await Promise.all([
    WorkspaceModel.countDocuments({ team: teamId }),
    WorkspaceModel.countDocuments({
    _id: { $in: uniqueWorkspaceIds },
    team: teamId,
    }),
  ]);

  if (
    matchingCount !== uniqueWorkspaceIds.length ||
    teamWorkspaceCount !== uniqueWorkspaceIds.length
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Workspace order is invalid");
  }

  await WorkspaceModel.bulkWrite(
    uniqueWorkspaceIds.map((workspaceId, index) => ({
      updateOne: {
        filter: { _id: workspaceId, team: teamId },
        update: { $set: { order: index } },
      },
    }))
  );

  return WorkspaceModel.find({ team: teamId }).sort({ order: 1, createdAt: 1 });
};

const deleteWorkspace = async (teamId: string, workspaceId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);

  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  const result = await WorkspaceModel.findOneAndDelete({ _id: workspaceId, team: teamId });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");
  }

  return result;
};

export const WorkspaceServices = {
  getTeamWorkspaces,
  createWorkspace,
  updateWorkspace,
  reorderWorkspaces,
  deleteWorkspace,
};
