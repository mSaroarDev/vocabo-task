import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { CommentServices } from "./comment.services";
import TaskModel from "../task/task.model";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getTaskByUuid = async (uuid: string) => {
  const task = await TaskModel.findOne({ uuid }).select("_id");
  return task ? String(task._id) : null;
};

const getComments: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const taskId = await getTaskByUuid(req.params.uuid as string);
  if (!taskId) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Task not found",
    });
    return;
  }
  const result = await CommentServices.getComments(
    req.params.teamId as string,
    req.params.workspaceId as string,
    taskId,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const createComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const taskId = await getTaskByUuid(req.params.uuid as string);
  if (!taskId) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Task not found",
    });
    return;
  }
  const result = await CommentServices.createComment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    taskId,
    getUserId(req as AuthRequest),
    req.body.content as string
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment created successfully",
    data: result,
  });
});

const deleteComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const taskId = await getTaskByUuid(req.params.uuid as string);
  if (!taskId) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Task not found",
    });
    return;
  }
  const result = await CommentServices.deleteComment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    taskId,
    req.params.commentId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentControllers = {
  getComments,
  createComment,
  deleteComment,
};
