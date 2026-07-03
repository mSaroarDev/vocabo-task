import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { ActivityLogServices } from "./activityLog.services";

const getTaskActivity: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityLogServices.getTaskActivity(req.params.taskId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity retrieved successfully",
    data: result,
  });
});

export const ActivityLogControllers = {
  getTaskActivity,
};
