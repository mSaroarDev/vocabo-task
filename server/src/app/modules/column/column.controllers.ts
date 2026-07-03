import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { ColumnServices } from "./column.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getColumns: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ColumnServices.getColumns(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Columns retrieved successfully",
    data: result,
  });
});

const replaceColumns: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ColumnServices.replaceColumns(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Columns updated successfully",
    data: result,
  });
});

export const ColumnControllers = {
  getColumns,
  replaceColumns,
};
