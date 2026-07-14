import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
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
    const { code, redirect_uri } = req.body;
    const result = await AuthServices.googleLogin(code, redirect_uri);
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

  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.updateProfile(userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  }),

  deleteAccount: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.deleteAccount(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Account deleted successfully",
      data: result,
    });
  }),

  generateTelegramToken: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.generateTelegramConnectToken(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Telegram connect token generated",
      data: result,
    });
  }),

  disconnectTelegram: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const result = await AuthServices.disconnectTelegram(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Telegram disconnected",
      data: result,
    });
  }),

  uploadAvatar: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const file = req.file;
    if (!file) {
      throw new AppError(httpStatus.BAD_REQUEST, "No file uploaded");
    }
    const result = await AuthServices.uploadAvatar(userId, file);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Avatar updated successfully",
      data: result,
    });
  }),
};
