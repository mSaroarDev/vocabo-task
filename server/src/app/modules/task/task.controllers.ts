import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { TaskServices } from "./task.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
};

const getTasks: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.getTasks(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks retrieved successfully",
    data: result,
  });
});

const getTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.getTask(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const getAssignedToMe: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const result = await TaskServices.getAssignedToMe(
    req.params.teamId as string,
    getUserId(req as AuthRequest),
    targetUserId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned tasks retrieved successfully",
    data: result,
  });
});

const createTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.createTask(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});

const updateTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.updateTask(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest),
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});

const deleteTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  await TaskServices.deleteTask(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task deleted successfully",
  });
});

const archiveTasks: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const taskIds = req.body.taskIds;
  const isArchived = typeof req.body.isArchived === "boolean" ? req.body.isArchived : true;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "taskIds array is required",
    });
    return;
  }

  const result = await TaskServices.setTasksArchive(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    taskIds as string[],
    isArchived
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: isArchived ? "Tasks archived successfully" : "Tasks unarchived successfully",
    data: result,
  });
});

const reorderTasks: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.reorderTasks(
    req.params.teamId as string,
    req.params.workspaceId as string,
    getUserId(req as AuthRequest),
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks reordered successfully",
    data: result,
  });
});

const reorderMemberTasks: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.reorderMemberTasks(
    req.params.teamId as string,
    getUserId(req as AuthRequest),
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member tasks reordered successfully",
    data: result,
  });
});

const addAttachment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "No file provided",
    });
    return;
  }
  const result = await TaskServices.addAttachment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest),
    file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attachment added successfully",
    data: result,
  });
});


const addAttachments: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "No files provided",
    });
    return;
  }
  const userId = getUserId(req as AuthRequest);
  let result;
  for (const file of files) {
    result = await TaskServices.addAttachment(
      req.params.teamId as string,
      req.params.workspaceId as string,
      req.params.taskId as string,
      userId,
      file
    );
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attachments added successfully",
    data: result,
  });
});

const removeAttachment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.removeAttachment(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    req.params.attachmentId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attachment removed successfully",
    data: result,
  });
});

const setBanner: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "No file provided",
    });
    return;
  }
  const result = await TaskServices.setBanner(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest),
    file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banner set successfully",
    data: result,
  });
});

const removeBanner: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.removeBanner(
    req.params.teamId as string,
    req.params.workspaceId as string,
    req.params.taskId as string,
    getUserId(req as AuthRequest)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banner removed successfully",
    data: result,
  });
});

export const TaskControllers = {
  getTasks,
  getTask,
  getAssignedToMe,
  createTask,
  updateTask,
  deleteTask,
  archiveTasks,
  reorderTasks,
  reorderMemberTasks,
  addAttachment,
  addAttachments,
  removeAttachment,
  setBanner,
  removeBanner,
};
