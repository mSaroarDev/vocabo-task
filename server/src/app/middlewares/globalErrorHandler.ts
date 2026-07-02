import { ErrorRequestHandler } from "express";
import config from "../config";
import AppError from "../errors/AppError";

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = "Something went wrong!";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.node_env === "development" && { stack: err.stack }),
  });
};

export default globalErrorHandler;
