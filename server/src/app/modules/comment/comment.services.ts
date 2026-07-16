import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import TeamModel from "../team/team.model";
import WorkspaceModel from "../workspace/workspace.model";
import TaskModel from "../task/task.model";
import CommentModel from "./comment.model";

const AUTHOR_PROJECTION = "name email avatar";

const ensureTaskAccess = async (teamId: string, workspaceId: string, taskId: string, userId: string) => {
  if (!Types.ObjectId.isValid(teamId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid team id");
  }
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid workspace id");
  }
  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid task id");
  }

  const team = await TeamModel.findOne({ _id: teamId, "members.user": userId });
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }

  const workspace = await WorkspaceModel.findOne({ _id: workspaceId, team: teamId });
  if (!workspace) {
    throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");
  }

  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId });
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  return task;
};

const getComments = async (teamId: string, workspaceId: string, taskId: string, userId: string) => {
  await ensureTaskAccess(teamId, workspaceId, taskId, userId);

  return CommentModel.find({ task: taskId })
    .populate("author", AUTHOR_PROJECTION)
    .sort({ createdAt: 1 })
    .lean();
};

const createComment = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  userId: string,
  content: string
) => {
  await ensureTaskAccess(teamId, workspaceId, taskId, userId);

  const comment = await CommentModel.create({
    task: taskId,
    author: userId,
    content: content.trim(),
  });

  return CommentModel.findById(comment._id).populate("author", AUTHOR_PROJECTION).lean();
};

const deleteComment = async (
  teamId: string,
  workspaceId: string,
  taskId: string,
  commentId: string,
  userId: string
) => {
  await ensureTaskAccess(teamId, workspaceId, taskId, userId);

  if (!Types.ObjectId.isValid(commentId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid comment id");
  }

  const comment = await CommentModel.findOne({ _id: commentId, task: taskId });
  if (!comment) {
    throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
  }

  if (comment.author.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You can only delete your own comments");
  }

  await CommentModel.deleteOne({ _id: commentId });
  return { deleted: true };
};

export const CommentServices = {
  getComments,
  createComment,
  deleteComment,
};
