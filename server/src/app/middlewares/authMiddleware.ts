import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import httpStatus from "http-status";
import catchAsync from "../utils/asyncCatch";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const authMiddleware = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key"
    ) as JwtPayload;

    if (!decoded || !decoded.id) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
    };
    next();
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
  }
});

export default authMiddleware;