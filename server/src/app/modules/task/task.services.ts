import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import TaskModel from "./task.model";
import type { TaskPriority } from "./task.interface";
import { getStorage } from "./task.storage";
import { ActivityLogServices } from "../activityLog/activityLog.services";

const ensureTeamMember = async (teamId: string, userId: string) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team id");
  }
  const team = await TeamModel.findOne({ _id: teamId, "members.user": userId });
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

const getTasks = async (teamId: string, workspaceId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);
  const tasks = await TaskModel.find({ workspace: workspaceId })
    .sort({ order: 1, createdAt: -1 })
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
  return tasks;
};

const getTask = async (teamId: string, workspaceId: string, taskId: string, userId: string) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);
  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }
  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId })
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }
  return task;
};

interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  assignedTo?: string;
  customFields?: Record<string, unknown>;
}

const createTask = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: CreateTaskPayload
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const lastTask = await TaskModel.findOne({ workspace: workspaceId }).sort({ order: -1 });
  const order = lastTask ? lastTask.order + 1 : 0;

  const defaultStatus = "New";
  const defaultPriority: TaskPriority = "None";

  const task = await TaskModel.create({
    workspace: new Types.ObjectId(workspaceId),
    title: payload.title.trim(),
    description: payload.description?.trim(),
    status: payload.status?.trim() || defaultStatus,
    priority: payload.priority || defaultPriority,
    customFields: payload.customFields ? new Map(Object.entries(payload.customFields)) : new Map(),
    assignedTo: payload.assignedTo ? new Types.ObjectId(payload.assignedTo) : undefined,
    createdBy: new Types.ObjectId(userId),
    order,
  });

  const populated = await task.populate(["createdBy", "assignedTo"]);

  await ActivityLogServices.logActivity({
    task: String(task._id),
    workspace: workspaceId,
    team: teamId,
    action: "created",
    performedBy: userId,
  });

  return populated;
};

interface UpdateTaskPayload {
  title?: string;
  banner?: string;
  isCompleted?: boolean;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  assignedTo?: string | null;
  customFields?: Record<string, unknown>;
}

const updateTask = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string,
  payload: UpdateTaskPayload
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const oldTask = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  if (!oldTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  const updateData: Record<string, unknown> = {};
  const changes: Array<{ field: string; oldValue?: string; newValue?: string }> = [];

  if (payload.title !== undefined) {
    updateData.title = payload.title.trim();
    changes.push({ field: "title", oldValue: oldTask.title, newValue: payload.title });
  }
  if (payload.banner !== undefined) updateData.banner = payload.banner;
  if (payload.isCompleted !== undefined) {
    updateData.isCompleted = payload.isCompleted;
    changes.push({
      field: "isCompleted",
      oldValue: String(oldTask.isCompleted),
      newValue: String(payload.isCompleted),
    });
  }
  if (payload.description !== undefined) {
    updateData.description = payload.description?.trim();
    changes.push({ field: "description", oldValue: oldTask.description, newValue: payload.description });
  }
  if (payload.status !== undefined) {
    updateData.status = payload.status.trim();
    changes.push({ field: "status", oldValue: oldTask.status, newValue: payload.status });
  }
  if (payload.priority !== undefined) {
    updateData.priority = payload.priority;
    changes.push({ field: "priority", oldValue: oldTask.priority, newValue: payload.priority });
  }
  if (payload.assignedTo !== undefined) {
    updateData.assignedTo = payload.assignedTo ? new Types.ObjectId(payload.assignedTo) : null;
    changes.push({
      field: "assignedTo",
      oldValue: String(oldTask.assignedTo ?? ""),
      newValue: payload.assignedTo ?? "",
    });
  }
  if (payload.customFields !== undefined) {
    updateData.customFields = new Map(Object.entries(payload.customFields));
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate(["createdBy", "assignedTo"]);

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  if (changes.length > 0) {
    await Promise.all(
      changes.map((c) =>
        ActivityLogServices.logActivity({
          task: taskId,
          workspace: workspaceId,
          team: teamId,
          action: "updated",
          field: c.field,
          oldValue: c.oldValue?.slice(0, 200),
          newValue: c.newValue?.slice(0, 200),
          performedBy: userId,
        })
      )
    );
  }

  return task;
};

const deleteTask = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const task = await TaskModel.findOneAndDelete({ _id: taskId, workspace: workspaceId });

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  await ActivityLogServices.logActivity({
    task: taskId,
    workspace: workspaceId,
    team: teamId,
    action: "deleted",
    performedBy: userId,
  });

  const storage = getStorage();
  const cleanup: Promise<void>[] = [];

  if (task.banner) {
    cleanup.push(storage.delete(task.banner));
  }

  for (const attachment of task.attachments) {
    cleanup.push(storage.delete(attachment.url));
  }

  await Promise.allSettled(cleanup);

  return task;
};

const reorderTasks = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  payload: { taskIds: string[] }
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const ids = payload.taskIds;

  if (ids.some((id) => !Types.ObjectId.isValid(id))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Task order contains duplicates");
  }

  const [workspaceTaskCount, matchingCount] = await Promise.all([
    TaskModel.countDocuments({ workspace: workspaceId }),
    TaskModel.countDocuments({ _id: { $in: uniqueIds }, workspace: workspaceId }),
  ]);

  if (matchingCount !== uniqueIds.length || workspaceTaskCount !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Task order is invalid");
  }

  await TaskModel.bulkWrite(
    uniqueIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId, workspace: workspaceId },
        update: { $set: { order: index } },
      },
    }))
  );

  return TaskModel.find({ workspace: workspaceId })
    .sort({ order: 1, createdAt: -1 })
    .populate(["createdBy", "assignedTo"]);
};

const addAttachment = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string,
  file: Express.Multer.File
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const storage = getStorage();

  let url: string;
  try {
    url = await storage.upload(file.path, file.filename, file.mimetype);
  } catch {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file");
  }

  const attachment = {
    filename: file.filename,
    originalName: file.originalname,
    url,
    size: file.size,
    mimeType: file.mimetype,
    uploadedBy: new Types.ObjectId(userId),
    uploadedAt: new Date(),
  };

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $push: { attachments: attachment } },
    { new: true, runValidators: true }
  ).populate(["createdBy", "assignedTo"]);

  if (!task) {
    await storage.delete(url);
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  return task;
};

const removeAttachment = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  attachmentId: string,
  userId: string
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId) || !Types.ObjectId.isValid(attachmentId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid id");
  }

  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  const attachment = (task.attachments as unknown as Array<{ _id: Types.ObjectId; url: string }>).find(
    (a) => String(a._id) === attachmentId
  );
  if (!attachment) {
    throw new AppError(httpStatus.NOT_FOUND, "Attachment not found");
  }

  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $pull: { attachments: { _id: attachmentId } } },
    { new: true }
  ).populate(["createdBy", "assignedTo"]);

  if (updated) {
    await getStorage().delete(attachment.url);
  }

  return updated;
};

const setBanner = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string,
  file: Express.Multer.File
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const storage = getStorage();

  let url: string;
  try {
    url = await storage.upload(file.path, file.filename, file.mimetype);
  } catch {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file");
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $set: { banner: url } },
    { new: true, runValidators: true }
  ).populate(["createdBy", "assignedTo"]);

  if (!task) {
    await storage.delete(url);
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  return task;
};

const removeBanner = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  const oldBanner = task.banner;

  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $unset: { banner: "" } },
    { new: true }
  ).populate(["createdBy", "assignedTo"]);

  if (updated && oldBanner) {
    await getStorage().delete(oldBanner);
  }

  return updated;
};

export const TaskServices = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addAttachment,
  removeAttachment,
  setBanner,
  removeBanner,
};
