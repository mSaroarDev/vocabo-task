import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { CommentServices } from "./comment.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getComments: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentServices.getComments(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
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
  const result = await CommentServices.createComment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
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
  const result = await CommentServices.deleteComment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
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
