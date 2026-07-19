import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import TaskModel from "./task.model";
import type { TaskPriority } from "./task.interface";
import { getStorage } from "./task.storage";
import { ActivityLogServices } from "../activityLog/activityLog.services";
import { NotificationServices } from "../notification/notification.services";
import { emitToUser } from "../../socket";
import { User } from "../auth/auth.model";
import { Input } from "telegraf";
import bot from "../auth/telegram.bot";
import config from "../../config";

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

    await bot?.telegram.sendMessage(
      assignedUser.telegramChatId,
      `📌 New Task\n\nTitle: ${title}\nPriority: ${emoji} ${priority}\nAssigned by: ${performedByName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(assignedUserId, {
        telegramConnected: false,
        telegramChatId: null,
        telegramConnectToken: null,
        telegramUsername: null,
      });
    }
    console.error("Telegram notification error:", error);
  }
};

const createAssignmentNotification = async (
  taskId: string,
  assignedUserId: string,
  title: string,
  performedByName: string,
  teamId: string,
  workspaceId: string,
  createdBy: string
) => {
  try {
    const notification = await NotificationServices.createNotification(createdBy, {
      title: "New task assigned",
      body: `${performedByName} assigned you "${title}"`,
      type: "task",
      recipientIds: [assignedUserId],
      teamId,
      workspaceId,
      taskId,
    });
    emitToUser(assignedUserId, "notification:new", notification);
  } catch (error) {
    console.error("Failed to create assignment notification:", error);
  }
};

const createTaskUpdateNotification = async (
  taskId: string,
  assignedUserId: string,
  title: string,
  performedByName: string,
  teamId: string,
  workspaceId: string,
  createdBy: string
) => {
  try {
    const notification = await NotificationServices.createNotification(createdBy, {
      title: "Task updated",
      body: `${performedByName} updated "${title}"`,
      type: "task",
      recipientIds: [assignedUserId],
      teamId,
      workspaceId,
      taskId,
    });
    emitToUser(assignedUserId, "notification:new", notification);
  } catch (error) {
    console.error("Failed to create task update notification:", error);
  }
};

const sendTaskCreatedNotification = async (
  taskId: string,
  title: string,
  priority: string,
  creatorName: string,
  teamId: string,
  workspaceId: string,
  recipientId: string
) => {
  try {
    const recipient = await User.findById(recipientId).select("telegramConnected telegramChatId");
    if (!recipient?.telegramConnected || !recipient.telegramChatId) return;

    const emoji = priorityEmoji[priority] || "⚪";

    const taskUrl = `${config.frontendUrl}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`;
    const replyMarkup = taskUrl.startsWith("https://")
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "Open Task", url: taskUrl }]],
          },
        }
      : {};

    await bot?.telegram.sendMessage(
      recipient.telegramChatId,
      `🆕 New Task Created\n\nTitle: ${title}\nPriority: ${emoji} ${priority}\nBy: ${creatorName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(recipientId, {
        telegramConnected: false,
        telegramChatId: null,
        telegramConnectToken: null,
        telegramUsername: null,
      });
    }
    console.error("Telegram notification error:", error);
  }
};

const createTaskCreatedNotification = async (
  taskId: string,
  title: string,
  creatorName: string,
  teamId: string,
  workspaceId: string,
  recipientId: string,
  createdBy: string
) => {
  try {
    const notification = await NotificationServices.createNotification(createdBy, {
      title: "New task created",
      body: `${creatorName} created "${title}"`,
      type: "task",
      recipientIds: [recipientId],
      teamId,
      workspaceId,
      taskId,
    });
    emitToUser(recipientId, "notification:new", notification);
  } catch (error) {
    console.error("Failed to create task created notification:", error);
  }
};

const sendTaskStatusChangeNotification = async (
  taskId: string,
  title: string,
  oldStatus: string,
  newStatus: string,
  performerName: string,
  teamId: string,
  workspaceId: string,
  recipientId: string
) => {
  try {
    const recipient = await User.findById(recipientId).select("telegramConnected telegramChatId");
    if (!recipient?.telegramConnected || !recipient.telegramChatId) return;

    const taskUrl = `${config.frontendUrl}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`;
    const replyMarkup = taskUrl.startsWith("https://")
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "Open Task", url: taskUrl }]],
          },
        }
      : {};

    await bot?.telegram.sendMessage(
      recipient.telegramChatId,
      `🔄 Task Status Changed\n\nTitle: ${title}\nStatus: ${oldStatus} → ${newStatus}\nBy: ${performerName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(recipientId, {
        telegramConnected: false,
        telegramChatId: null,
        telegramConnectToken: null,
        telegramUsername: null,
      });
    }
    console.error("Telegram notification error:", error);
  }
};

const createTaskStatusChangeNotification = async (
  taskId: string,
  title: string,
  oldStatus: string,
  newStatus: string,
  performerName: string,
  teamId: string,
  workspaceId: string,
  recipientId: string,
  createdBy: string
) => {
  try {
    const notification = await NotificationServices.createNotification(createdBy, {
      title: "Task status changed",
      body: `${performerName} changed "${title}" status: ${oldStatus} → ${newStatus}`,
      type: "task",
      recipientIds: [recipientId],
      teamId,
      workspaceId,
      taskId,
    });
    emitToUser(recipientId, "notification:new", notification);
  } catch (error) {
    console.error("Failed to create task status change notification:", error);
  }
};

const sendAttachmentTelegramNotification = async (
  taskId: string,
  title: string,
  performerName: string,
  teamId: string,
  workspaceId: string,
  recipientId: string,
  imageUrl: string,
  fileName: string,
  localFilePath: string
) => {
  try {
    const recipient = await User.findById(recipientId).select("telegramConnected telegramChatId");
    if (!recipient?.telegramConnected || !recipient.telegramChatId) return;

    const taskUrl = `${config.frontendUrl}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`;
    const replyMarkup = taskUrl.startsWith("https://")
      ? { reply_markup: { inline_keyboard: [[{ text: "Open Task", url: taskUrl }]] } }
      : {};

    const caption = `📎 New Image Added\n\nTitle: ${title}\nFile: ${fileName}\nAdded by: ${performerName}`;

    const photoSource = imageUrl.startsWith("http")
      ? imageUrl
      : Input.fromLocalFile(localFilePath);

    await bot?.telegram.sendPhoto(recipient.telegramChatId, photoSource, {
      caption,
      ...replyMarkup,
    });
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(recipientId, {
        telegramConnected: false,
        telegramChatId: null,
        telegramConnectToken: null,
        telegramUsername: null,
      });
    }
    console.error("Telegram attachment notification error:", error);
  }
};

const createAttachmentNotification = async (
  taskId: string,
  title: string,
  performerName: string,
  teamId: string,
  workspaceId: string,
  createdBy: string,
  recipientIds: string[],
  imageUrl: string,
  fileName: string
) => {
  for (const recipientId of recipientIds) {
    try {
      const notification = await NotificationServices.createNotification(createdBy, {
        title: "New attachment added",
        body: `${performerName} added "${fileName}" to "${title}"`,
        type: "task",
        recipientIds: [recipientId],
        teamId,
        workspaceId,
        taskId,
        imageUrl,
      });
      emitToUser(recipientId, "notification:new", notification);
    } catch (error) {
      console.error("Failed to create attachment notification:", error);
    }
  }
};

const fieldLabels: Record<string, string> = {
  title: "Title",
  isCompleted: "Completed",
  description: "Description",
  status: "Status",
  priority: "Priority",
  tags: "Tags",
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

    await bot?.telegram.sendMessage(
      assignedUser.telegramChatId,
      `✏️ Task Updated: ${title}\n\n${lines.join("\n")}\n\nUpdated by: ${performedByName}`,
      replyMarkup
    );
  } catch (error: any) {
    if (error?.response?.error_code === 403) {
      await User.findByIdAndUpdate(assignedUserId, {
        telegramConnected: false,
        telegramChatId: null,
        telegramConnectToken: null,
        telegramUsername: null,
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

const getAssignedToMe = async (teamId: string, requesterId: string, targetUserId?: string) => {
  const team = await ensureTeamMember(teamId, requesterId);

  let effectiveUserId = requesterId;
  if (targetUserId && targetUserId !== "me") {
    const isMember = team.members.some(
      (member) => member.user.toString() === targetUserId
    );
    if (!isMember) {
      throw new AppError(httpStatus.FORBIDDEN, "User is not a member of this team");
    }
    effectiveUserId = targetUserId;
  }

  const workspaces = await WorkspaceModel.find({ team: teamId });
  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const workspaceNameMap = new Map(
    workspaces.map((workspace) => [workspace._id.toString(), workspace.name])
  );
  const tasks = await TaskModel.find({
    workspace: { $in: workspaceIds },
    assignedTo: effectiveUserId,
  })
    .sort({ memberTaskOrder: 1, createdAt: -1 })
    .populate("createdBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
  return tasks.map((task) => ({
    ...task.toObject(),
    workspaceName: workspaceNameMap.get(task.workspace.toString()) ?? "Unknown",
  }));
};

interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  assignedTo?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
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
    tags: payload.tags ?? [],
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

  if (payload.assignedTo) {
    const performer = await User.findById(userId).select("name");
    const performerName = performer?.name || "Unknown";
    sendTaskAssignedNotification(
      String(task._id),
      payload.assignedTo,
      task.title,
      task.priority,
      performerName,
      teamId,
      workspaceId
    );
    createAssignmentNotification(
      String(task._id),
      payload.assignedTo,
      task.title,
      performerName,
      teamId,
      workspaceId,
      userId
    );
  }

  const creator = await User.findById(userId).select("name");
  const creatorName = creator?.name || "Unknown";

  const team = await TeamModel.findById(teamId).select("owner members");
  if (team) {
    const recipientIds = [
      team.owner,
      ...team.members.filter((m) => m.role === "project manager").map((m) => m.user),
    ]
      .map((id) => id.toString())
      .filter((id, index, arr) => arr.indexOf(id) === index && id !== userId);

    for (const recipientId of recipientIds) {
      sendTaskCreatedNotification(
        String(task._id),
        task.title,
        task.priority,
        creatorName,
        teamId,
        workspaceId,
        recipientId
      );
      createTaskCreatedNotification(
        String(task._id),
        task.title,
        creatorName,
        teamId,
        workspaceId,
        recipientId,
        userId
      );
    }
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
  tags?: string[];
  isArchived?: boolean;
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
  if (payload.tags !== undefined) {
    updateData.tags = payload.tags;
    changes.push({
      field: "tags",
      oldValue: (oldTask.tags ?? []).join(", "),
      newValue: payload.tags.join(", "),
    });
  }
  if (payload.isArchived !== undefined) {
    updateData.isArchived = payload.isArchived;
    changes.push({
      field: "isArchived",
      oldValue: String(oldTask.isArchived),
      newValue: String(payload.isArchived),
    });
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
    const performerName = performer?.name || "Unknown";
    sendTaskAssignedNotification(
      taskId,
      payload.assignedTo,
      task.title,
      task.priority,
      performerName,
      teamId,
      workspaceId
    );
    createAssignmentNotification(
      taskId,
      payload.assignedTo,
      task.title,
      performerName,
      teamId,
      workspaceId,
      userId
    );
  }

  const otherChanges = changes.filter((c) => c.field !== "assignedTo");
  if (otherChanges.length > 0 && task.assignedTo) {
    const assignedUserId = typeof task.assignedTo === "object"
      ? String((task.assignedTo as any)._id || task.assignedTo)
      : String(task.assignedTo);

    if (assignedUserId !== userId) {
      const performer = await User.findById(userId).select("name");
      const performerName = performer?.name || "Unknown";
      sendTaskUpdateNotification(
        taskId,
        task.title,
        assignedUserId,
        otherChanges,
        performerName,
        teamId,
        workspaceId
      );

      createTaskUpdateNotification(
        taskId,
        assignedUserId,
        task.title,
        performerName,
        teamId,
        workspaceId,
        userId
      );
    }
  }

  if (payload.status !== undefined && oldTask.status !== payload.status.trim()) {
    const performer = await User.findById(userId).select("name");
    const performerName = performer?.name || "Unknown";
    const newStatus = payload.status.trim();

    const team = await TeamModel.findById(teamId).select("owner members");
    if (team) {
      const recipientIds = [
        team.owner,
        ...team.members.filter((m) => m.role === "project manager").map((m) => m.user),
      ]
        .map((id) => id.toString())
        .filter((id, index, arr) => arr.indexOf(id) === index && id !== userId);

      for (const recipientId of recipientIds) {
        sendTaskStatusChangeNotification(
          taskId,
          task.title,
          oldTask.status,
          newStatus,
          performerName,
          teamId,
          workspaceId,
          recipientId
        );
        createTaskStatusChangeNotification(
          taskId,
          task.title,
          oldTask.status,
          newStatus,
          performerName,
          teamId,
          workspaceId,
          recipientId,
          userId
        );
      }
    }
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

  const matchingCount = await TaskModel.countDocuments({
    _id: { $in: uniqueIds },
    workspace: workspaceId,
  });

  if (matchingCount !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Some tasks were not found in this workspace");
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


const reorderMemberTasks = async (
  teamId: string,
  userId: string,
  payload: { taskIds: string[] }
) => {
  await ensureTeamMember(teamId, userId);

  const ids = payload.taskIds;

  if (ids.some((id) => !Types.ObjectId.isValid(id))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Task order contains duplicates");
  }

  const matchingCount = await TaskModel.countDocuments({ _id: { $in: uniqueIds } });

  if (matchingCount !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Some tasks were not found");
  }

  await TaskModel.bulkWrite(
    uniqueIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId },
        update: { $set: { memberTaskOrder: index } },
      },
    }))
  );

  const tasks = await TaskModel.find({ _id: { $in: uniqueIds } })
    .sort({ memberTaskOrder: 1 })
    .populate(["createdBy", "assignedTo"]);

  const workspaceIds = [...new Set(tasks.map((t) => t.workspace.toString()))];
  const workspaces = await WorkspaceModel.find({ _id: { $in: workspaceIds } });
  const workspaceNameMap = new Map(
    workspaces.map((w) => [w._id.toString(), w.name])
  );

  return tasks.map((task) => ({
    ...task.toObject(),
    workspaceName: workspaceNameMap.get(task.workspace.toString()) ?? "Unknown",
  }));
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

  const performer = await User.findById(userId).select("name");
  const performerName = performer?.name || "Unknown";

  const team = await TeamModel.findById(teamId).select("owner members");
  if (team) {
    const assignedUserId = task.assignedTo
      ? (typeof task.assignedTo === "object" && "_id" in task.assignedTo
          ? String(task.assignedTo._id)
          : String(task.assignedTo))
      : null;
    const createdById = task.createdBy
      ? (typeof task.createdBy === "object" && "_id" in task.createdBy
          ? String(task.createdBy._id)
          : String(task.createdBy))
      : null;

    const recipientIds = [
      ...(assignedUserId ? [assignedUserId] : []),
      ...(createdById ? [createdById] : []),
      String(team.owner),
      ...team.members.filter((m) => m.role === "project manager").map((m) => String(m.user)),
    ]
      .filter((id, index, arr) => arr.indexOf(id) === index && id !== userId);

    if (recipientIds.length > 0 && file.mimetype.startsWith("image/")) {
      createAttachmentNotification(
        String(task._id),
        task.title,
        performerName,
        teamId,
        workspaceId,
        userId,
        recipientIds,
        url,
        file.originalname
      );

      for (const recipientId of recipientIds) {
        sendAttachmentTelegramNotification(
          String(task._id),
          task.title,
          performerName,
          teamId,
          workspaceId,
          recipientId,
          url,
          file.originalname,
          file.path
        );
      }
    }
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

const setTasksArchive = async (
  teamId: string,
  workspaceId: string,
  userId: string,
  taskIds: string[],
  isArchived: boolean
) => {
  await ensureTeamMember(teamId, userId);
  await ensureWorkspace(teamId, workspaceId);

  const validIds = taskIds.filter((id) => Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No valid task ids provided");
  }

  const matching = await TaskModel.find({
    _id: { $in: validIds },
    workspace: workspaceId,
  });

  if (matching.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No tasks found");
  }

  await TaskModel.updateMany(
    { _id: { $in: matching.map((t) => t._id) }, workspace: workspaceId },
    { $set: { isArchived } }
  );

  const updated = await TaskModel.find({
    _id: { $in: matching.map((t) => t._id) },
    workspace: workspaceId,
  }).populate(["createdBy", "assignedTo"]);

  return updated;
};

export const TaskServices = {
  getTasks,
  getTask,
  getAssignedToMe,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  reorderMemberTasks,
  addAttachment,
  removeAttachment,
  setTasksArchive,
  setBanner,
  removeBanner,
};
