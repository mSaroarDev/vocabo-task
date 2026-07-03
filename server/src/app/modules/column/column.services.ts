import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import ColumnModel from "./column.model";
import { DEFAULT_COLUMN_SEED } from "./column.interface";

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

export const seedDefaultColumns = async (workspaceId: Types.ObjectId) => {
  const docs = DEFAULT_COLUMN_SEED.map((seed, index) => ({
    workspace: workspaceId,
    key: seed.key,
    label: seed.label,
    order: index,
  }));
  await ColumnModel.insertMany(docs, { ordered: true });
};

const getColumns = async (teamId: string, workspaceId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);
  const columns = await ColumnModel.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });
  return columns;
};

const replaceColumns = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: { columns: Array<{ key: string; label: string }> }
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const incoming = payload.columns;
  const incomingKeys = incoming.map((c) => c.key);

  if (incomingKeys.some((k) => k.length === 0)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Column key is required");
  }

  const existing = await ColumnModel.find({ workspace: workspaceId });
  const existingByKey = new Map(existing.map((c) => [c.key, c]));

  const operations: Array<Promise<unknown>> = [];
  const seenKeys = new Set<string>();

  for (let index = 0; index < incoming.length; index += 1) {
    const { key, label } = incoming[index];
    if (seenKeys.has(key)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Column keys must be unique");
    }
    seenKeys.add(key);

    const current = existingByKey.get(key);
    if (current) {
      if (current.label !== label || current.order !== index) {
        operations.push(
          ColumnModel.updateOne(
            { _id: current._id },
            { $set: { label, order: index } }
          )
        );
      }
    } else {
      operations.push(
        ColumnModel.create({
          workspace: new Types.ObjectId(workspaceId),
          key,
          label,
          order: index,
        })
      );
    }
  }

  const removed = existing.filter((c) => !seenKeys.has(c.key));
  if (removed.length > 0) {
    operations.push(ColumnModel.deleteMany({ _id: { $in: removed.map((c) => c._id) } }));
  }

  await Promise.all(operations);

  return ColumnModel.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });
};

export const ColumnServices = {
  getColumns,
  replaceColumns,
  seedDefaultColumns,
};
