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

export const TeamControllers = {
  createTeam,
  getMyTeams,
  joinTeam,
};
