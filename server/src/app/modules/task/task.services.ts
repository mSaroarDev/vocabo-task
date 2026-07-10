import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import TaskModel from "./task.model";
import type { TaskPriority } from "./task.interface";
import { getStorage } from "./task.storage";
import { ActivityLogServices } from "../activityLog/activityLog.services";
import { User } from "../auth/auth.model";
import bot from "../auth/telegram.bot";
import config from "../../config";
import { NotificationServices } from "../notification/notification.services";

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

const priorityEmoji: Record<string, string> = {
  None: "⚪",
  Lowest: "⬇️",
  Low: "🔽",
  Medium: "🟡",
  High: "🔼",
  Highest: "🔴",
};

const sendTaskAssignedNotification = async (
  taskId: string,
  assignedUserId: string,
  title: string,
  priority: string,
  performedByName: string,
  teamId: string,
  workspaceId: string
) => {
  try {
    const assignedUser = await User.findById(assignedUserId).select("telegramConnected telegramChatId");
    if (!assignedUser?.telegramConnected || !assignedUser.telegramChatId) return;

    const emoji = priorityEmoji[priority] || "⚪";

    const taskUrl = `${config.frontendUrl}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`;
    const replyMarkup = taskUrl.startsWith("https://")
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "Open Task", url: taskUrl }]],
          },
        }
      : {};

    await bot.telegram.sendMessage(
      assignedUser.telegramChatId,
      `📌 New Task\n\nTitle: ${title}\nPriority: ${emoji} ${priority}\nAssigned by: ${performedByName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(assignedUserId, {
        telegramConnected: false,
        telegramChatId: null,
      });
    }
    console.error("Telegram notification error:", error);
  }
};

const fieldLabels: Record<string, string> = {
  title: "Title",
  isCompleted: "Completed",
  description: "Description",
  status: "Status",
  priority: "Priority",
};

const sendTaskUpdateNotification = async (
  taskId: string,
  title: string,
  assignedUserId: string,
  changes: Array<{ field: string; oldValue?: string; newValue?: string }>,
  performedByName: string,
  teamId: string,
  workspaceId: string
) => {
  try {
    const assignedUser = await User.findById(assignedUserId).select("telegramConnected telegramChatId");
    if (!assignedUser?.telegramConnected || !assignedUser.telegramChatId) return;

    const lines = changes.map((c) => {
      const label = fieldLabels[c.field] || c.field;
      if (c.field === "isCompleted") {
        const oldVal = c.oldValue === "true" ? "✅" : "❌";
        const newVal = c.newValue === "true" ? "✅" : "❌";
        return `• ${label}: ${oldVal} → ${newVal}`;
      }
      return `• ${label}: ${c.oldValue || "(empty)"} → ${c.newValue || "(empty)"}`;
    });

    const taskUrl = `${config.frontendUrl}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`;
    const replyMarkup = taskUrl.startsWith("https://")
      ? { reply_markup: { inline_keyboard: [[{ text: "Open Task", url: taskUrl }]] } }
      : {};

    await bot.telegram.sendMessage(
      assignedUser.telegramChatId,
      `✏️ Task Updated: ${title}\n\n${lines.join("\n")}\n\nUpdated by: ${performedByName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(assignedUserId, {
        telegramConnected: false,
        telegramChatId: null,
      });
    }
    console.error("Telegram notification error:", error);
  }
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

  const performer = await User.findById(userId).select("name avatar");

  await NotificationServices.log({
    workspaceId,
    teamId,
    actorId: userId,
    actorName: performer?.name || "Someone",
    actorAvatar: performer?.avatar || undefined,
    type: "TASK_CREATED",
    entityType: "task",
    entityId: String(task._id),
    title: "Task created",
    description: `${performer?.name || "Someone"} created "${task.title}"`,
    metadata: {
      taskTitle: task.title,
      status: task.status,
      priority: task.priority,
    },
  });

  if (payload.assignedTo) {
    const performer = await User.findById(userId).select("name");
    sendTaskAssignedNotification(
      String(task._id),
      payload.assignedTo,
      task.title,
      task.priority,
      performer?.name || "Unknown",
      teamId,
      workspaceId
    );

    const assignedUser = await User.findById(payload.assignedTo).select("name");

    await NotificationServices.log({
      workspaceId,
      teamId,
      actorId: userId,
      actorName: performer?.name || "Someone",
      actorAvatar: performer?.avatar || undefined,
      type: "TASK_ASSIGNED",
      entityType: "task",
      entityId: String(task._id),
      title: "Task assigned",
      description: `${performer?.name || "Someone"} assigned "${task.title}" to ${assignedUser?.name || "a user"}`,
      metadata: {
        taskTitle: task.title,
        assignedTo: payload.assignedTo,
        assignedToName: assignedUser?.name,
      },
    });
  }

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

  if (payload.assignedTo && payload.assignedTo !== String(oldTask.assignedTo ?? "")) {
    const performer = await User.findById(userId).select("name");
    sendTaskAssignedNotification(
      taskId,
      payload.assignedTo,
      task.title,
      task.priority,
      performer?.name || "Unknown",
      teamId,
      workspaceId
    );
  }

  const otherChanges = changes.filter((c) => c.field !== "assignedTo");
  if (otherChanges.length > 0 && task.assignedTo) {
    const assignedUserId = typeof task.assignedTo === "object"
      ? String((task.assignedTo as any)._id || task.assignedTo)
      : String(task.assignedTo);
    const performer = await User.findById(userId).select("name");
    sendTaskUpdateNotification(
      taskId,
      task.title,
      assignedUserId,
      otherChanges,
      performer?.name || "Unknown",
      teamId,
      workspaceId
    );
  }

  const performer = await User.findById(userId).select("name avatar");

  const notificationPromises: Promise<unknown>[] = [];

  for (const change of changes) {
    if (change.field === "assignedTo") {
      if (payload.assignedTo) {
        const assignedUser = await User.findById(payload.assignedTo).select("name");
        notificationPromises.push(
          NotificationServices.log({
            workspaceId,
            teamId,
            actorId: userId,
            actorName: performer?.name || "Someone",
            actorAvatar: performer?.avatar || undefined,
            type: "TASK_ASSIGNED",
            entityType: "task",
            entityId: taskId,
            title: "Task assigned",
            description: `${performer?.name || "Someone"} assigned "${task.title}" to ${assignedUser?.name || "a user"}`,
            metadata: {
              taskTitle: task.title,
              assignedTo: payload.assignedTo,
              assignedToName: assignedUser?.name,
            },
          })
        );
      } else {
        notificationPromises.push(
          NotificationServices.log({
            workspaceId,
            teamId,
            actorId: userId,
            actorName: performer?.name || "Someone",
            actorAvatar: performer?.avatar || undefined,
            type: "TASK_UNASSIGNED",
            entityType: "task",
            entityId: taskId,
            title: "Task unassigned",
            description: `${performer?.name || "Someone"} unassigned "${task.title}"`,
            metadata: { taskTitle: task.title },
          })
        );
      }
    } else if (change.field === "isCompleted") {
      const isCompleted = change.newValue === "true";
      notificationPromises.push(
        NotificationServices.log({
          workspaceId,
          teamId,
          actorId: userId,
          actorName: performer?.name || "Someone",
          actorAvatar: performer?.avatar || undefined,
          type: isCompleted ? "TASK_COMPLETED" : "TASK_REOPENED",
          entityType: "task",
          entityId: taskId,
          title: isCompleted ? "Task completed" : "Task reopened",
          description: `${performer?.name || "Someone"} ${isCompleted ? "completed" : "reopened"} "${task.title}"`,
          metadata: { taskTitle: task.title },
        })
      );
    } else if (change.field === "status") {
      notificationPromises.push(
        NotificationServices.log({
          workspaceId,
          teamId,
          actorId: userId,
          actorName: performer?.name || "Someone",
          actorAvatar: performer?.avatar || undefined,
          type: "TASK_STATUS_CHANGED",
          entityType: "task",
          entityId: taskId,
          title: "Status changed",
          description: `${performer?.name || "Someone"} changed "${task.title}" from ${change.oldValue || "(none)"} to ${change.newValue || "(none)"}`,
          metadata: {
            taskTitle: task.title,
            oldStatus: change.oldValue,
            newStatus: change.newValue,
          },
        })
      );
    } else if (change.field === "priority") {
      notificationPromises.push(
        NotificationServices.log({
          workspaceId,
          teamId,
          actorId: userId,
          actorName: performer?.name || "Someone",
          actorAvatar: performer?.avatar || undefined,
          type: "TASK_PRIORITY_CHANGED",
          entityType: "task",
          entityId: taskId,
          title: "Priority changed",
          description: `${performer?.name || "Someone"} changed "${task.title}" priority from ${change.oldValue || "(none)"} to ${change.newValue || "(none)"}`,
          metadata: {
            taskTitle: task.title,
            oldPriority: change.oldValue,
            newPriority: change.newValue,
          },
        })
      );
    } else {
      notificationPromises.push(
        NotificationServices.log({
          workspaceId,
          teamId,
          actorId: userId,
          actorName: performer?.name || "Someone",
          actorAvatar: performer?.avatar || undefined,
          type: "TASK_UPDATED",
          entityType: "task",
          entityId: taskId,
          title: "Task updated",
          description: `${performer?.name || "Someone"} updated "${task.title}" (${change.field})`,
          metadata: {
            taskTitle: task.title,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          },
        })
      );
    }
  }

  await Promise.all(notificationPromises);

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

  const performer = await User.findById(userId).select("name avatar");

  await NotificationServices.log({
    workspaceId,
    teamId,
    actorId: userId,
    actorName: performer?.name || "Someone",
    actorAvatar: performer?.avatar || undefined,
    type: "TASK_DELETED",
    entityType: "task",
    entityId: taskId,
    title: "Task deleted",
    description: `${performer?.name || "Someone"} deleted "${task.title}"`,
    metadata: { taskTitle: task.title },
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

  const performer = await User.findById(userId).select("name avatar");

  await NotificationServices.log({
    workspaceId,
    teamId,
    actorId: userId,
    actorName: performer?.name || "Someone",
    actorAvatar: performer?.avatar || undefined,
    type: "FILE_UPLOADED",
    entityType: "task",
    entityId: taskId,
    title: "File uploaded",
    description: `${performer?.name || "Someone"} uploaded "${file.originalname}" to "${task.title}"`,
    metadata: {
      taskTitle: task.title,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  });

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

  const performer = await User.findById(userId).select("name avatar");

  await NotificationServices.log({
    workspaceId,
    teamId,
    actorId: userId,
    actorName: performer?.name || "Someone",
    actorAvatar: performer?.avatar || undefined,
    type: "ATTACHMENT_REMOVED",
    entityType: "task",
    entityId: taskId,
    title: "Attachment removed",
    description: `${performer?.name || "Someone"} removed an attachment from "${updated?.title || "a task"}"`,
    metadata: {
      taskTitle: updated?.title,
      fileName: attachment.url,
    },
  });

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
