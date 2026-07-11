import { Request, Response } from "express";
import { RequestHandler } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { TeamServices } from "./team.services";

const getUserId = (req: AuthRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
  }
  return userId;
};

const createTeam: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const result = await TeamServices.createTeam(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Team created successfully",
    data: result,
  });
});

const getMyTeams: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const result = await TeamServices.getMyTeams(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Teams retrieved successfully",
    data: result,
  });
});

const joinTeam: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const result = await TeamServices.joinTeam(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Team joined successfully",
    data: result,
  });
});

const addMember: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const teamId = req.params.teamId as string;
  const { email } = req.body;
  const result = await TeamServices.addMember(teamId, userId, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member added successfully",
    data: result,
  });
});

const removeMember: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const teamId = req.params.teamId as string;
  const memberUserId = req.params.memberUserId as string;
  const result = await TeamServices.removeMember(teamId, userId, memberUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member removed successfully",
    data: result,
  });
});

const deleteTeam: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const teamId = req.params.teamId as string;
  await TeamServices.deleteTeam(teamId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Team deleted successfully",
    data: { teamId },
  });
});

const leaveTeam: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req as AuthRequest);
  const teamId = req.params.teamId as string;
  const result = await TeamServices.leaveTeam(teamId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Left team successfully",
    data: result,
  });
});

export const TeamControllers = {
  createTeam,
  getMyTeams,
  joinTeam,
  addMember,
  removeMember,
  deleteTeam,
  leaveTeam,
};
