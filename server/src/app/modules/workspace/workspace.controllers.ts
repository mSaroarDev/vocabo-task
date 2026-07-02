import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { WorkspaceServices } from "./workspace.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
  }
  return userId;
};

const getTeamId = (req: Request) => req.params.teamId as string;

const getTeamWorkspaces: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkspaceServices.getTeamWorkspaces(
    getTeamId(req),
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspaces retrieved successfully",
    data: result,
  });
});

const createWorkspace: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkspaceServices.createWorkspace(
    getTeamId(req),
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Workspace created successfully",
    data: result,
  });
});

const updateWorkspace: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkspaceServices.updateWorkspace(
    getTeamId(req),
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspace updated successfully",
    data: result,
  });
});

const reorderWorkspaces: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkspaceServices.reorderWorkspaces(
    getTeamId(req),
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspaces reordered successfully",
    data: result,
  });
});

const deleteWorkspace: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkspaceServices.deleteWorkspace(
    getTeamId(req),
    req.params.workspaceId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspace deleted successfully",
    data: result,
  });
});

export const WorkspaceControllers = {
  getTeamWorkspaces,
  createWorkspace,
  updateWorkspace,
  reorderWorkspaces,
  deleteWorkspace,
};
