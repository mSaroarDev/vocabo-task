import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import StatusOptionModel from "./statusOption.model";
import { DEFAULT_STATUS_OPTIONS } from "./statusOption.interface";

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

const ensureWorkspace = async (teamId: string, workspaceId: string) => {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }

  const workspace = await WorkspaceModel.findOne({ _id: workspaceId, team: teamId });
  if (!workspace) {
    throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");
  }

  return workspace;
};

export const seedDefaultStatusOptions = async (workspaceId: Types.ObjectId, teamId: Types.ObjectId) => {
  const docs = DEFAULT_STATUS_OPTIONS.map((opt, index) => ({
    workspace: workspaceId,
    team: teamId,
    label: opt.label,
    color: opt.color,
    order: index,
  }));
  await StatusOptionModel.insertMany(docs, { ordered: true });
};

const getStatusOptions = async (teamId: string, workspaceId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);
  const options = await StatusOptionModel.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });
  if (options.length === 0) {
    await seedDefaultStatusOptions(new Types.ObjectId(workspaceId), new Types.ObjectId(teamId));
    return StatusOptionModel.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });
  }
  return options;
};

const createStatusOption = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: { label: string; color: string }
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const existing = await StatusOptionModel.findOne({ workspace: workspaceId, label: payload.label.trim() });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "A status with this label already exists");
  }

  const lastOption = await StatusOptionModel.findOne({ workspace: workspaceId }).sort({ order: -1 });
  const nextOrder = lastOption ? lastOption.order + 1 : 0;

  const result = await StatusOptionModel.create({
    workspace: new Types.ObjectId(workspaceId),
    team: new Types.ObjectId(teamId),
    label: payload.label.trim(),
    color: payload.color.trim(),
    order: nextOrder,
    createdBy: new Types.ObjectId(userId),
  });

  return result;
};

const updateStatusOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string,
  userId: string,
  payload: { label?: string; color?: string }
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(optionId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid status option id");
  }

  const option = await StatusOptionModel.findOne({ _id: optionId, workspace: workspaceId });
  if (!option) {
    throw new AppError(httpStatus.NOT_FOUND, "Status option not found");
  }

  if (payload.label) {
    const trimmedLabel = payload.label.trim();
    const duplicate = await StatusOptionModel.findOne({
      workspace: workspaceId,
      label: trimmedLabel,
      _id: { $ne: optionId },
    });
    if (duplicate) {
      throw new AppError(httpStatus.CONFLICT, "A status with this label already exists");
    }
    option.label = trimmedLabel;
  }

  if (payload.color) {
    option.color = payload.color.trim();
  }

  await option.save();
  return option;
};

const reorderStatusOptions = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: { optionIds: string[] }
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const uniqueIds = [...new Set(payload.optionIds)];
  if (uniqueIds.length !== payload.optionIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Duplicate option ids");
  }

  const count = await StatusOptionModel.countDocuments({ workspace: workspaceId });
  if (payload.optionIds.length !== count) {
    throw new AppError(httpStatus.BAD_REQUEST, "Option ids must include all status options");
  }

  await StatusOptionModel.bulkWrite(
    payload.optionIds.map((optionId, index) => ({
      updateOne: {
        filter: { _id: optionId, workspace: workspaceId },
        update: { $set: { order: index } },
      },
    }))
  );

  return StatusOptionModel.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });
};

const deleteStatusOption = async (
  teamId: string,
  workspaceId: string,
  optionId: string,
  userId: string
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(optionId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid status option id");
  }

  const result = await StatusOptionModel.findOneAndDelete({ _id: optionId, workspace: workspaceId });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Status option not found");
  }

  return result;
};

export const StatusOptionServices = {
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  reorderStatusOptions,
  seedDefaultStatusOptions,
};
