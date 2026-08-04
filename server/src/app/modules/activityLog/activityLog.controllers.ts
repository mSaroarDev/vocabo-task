import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { ActivityLogServices } from "./activityLog.services";
import TaskModel from "../task/task.model";

const getTaskActivity: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskModel.findOne({ uuid: req.params.uuid as string }).select("_id");
  if (!task) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Task not found",
    });
    return;
  }
  const result = await ActivityLogServices.getTaskActivity(String(task._id));
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
