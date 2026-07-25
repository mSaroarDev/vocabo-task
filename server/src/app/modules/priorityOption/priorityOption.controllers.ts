import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { PriorityOptionServices } from "./priorityOption.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getPriorityOptions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await PriorityOptionServices.getPriorityOptions(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority options retrieved successfully",
    data: result,
  });
});

const createPriorityOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await PriorityOptionServices.createPriorityOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Priority option created successfully",
    data: result,
  });
});

const updatePriorityOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await PriorityOptionServices.updatePriorityOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.optionId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority option updated successfully",
    data: result,
  });
});

const deletePriorityOption: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await PriorityOptionServices.deletePriorityOption(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.optionId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority option deleted successfully",
    data: result,
  });
});

const reorderPriorityOptions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await PriorityOptionServices.reorderPriorityOptions(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority options reordered successfully",
    data: result,
  });
});

export const PriorityOptionControllers = {
  getPriorityOptions,
  createPriorityOption,
  updatePriorityOption,
  deletePriorityOption,
  reorderPriorityOptions,
};
