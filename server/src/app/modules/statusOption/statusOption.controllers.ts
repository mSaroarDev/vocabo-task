import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { StatusOptionServices } from "./statusOption.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getStatusOptions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StatusOptionServices.getStatusOptions(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status options retrieved successfully",
    data: result,
  });
});

const createStatusOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StatusOptionServices.createStatusOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Status option created successfully",
    data: result,
  });
});

const updateStatusOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StatusOptionServices.updateStatusOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.optionId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status option updated successfully",
    data: result,
  });
});

const deleteStatusOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StatusOptionServices.deleteStatusOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.optionId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status option deleted successfully",
    data: result,
  });
});

const reorderStatusOptions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StatusOptionServices.reorderStatusOptions(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status options reordered successfully",
    data: result,
  });
});

export const StatusOptionControllers = {
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  reorderStatusOptions,
};
