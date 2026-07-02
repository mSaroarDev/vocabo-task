import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.services";

export const AuthControllers = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.register(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User registered successfully",
      data: { user: result.user, token: result.token },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.login(req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged in successfully",
      data: { user: result.user, token: result.token },
    });
  }),

  googleLogin: catchAsync(async (req: Request, res: Response) => {
    const { code } = req.body;
    const result = await AuthServices.googleLogin(code);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged in with Google successfully",
      data: { user: result.user, token: result.token },
    });
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.getMe(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile retrieved successfully",
      data: result,
    });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.logout(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged out successfully",
      data: result,
    });
  }),
};
