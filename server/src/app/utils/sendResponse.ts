import { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

const sendResponse = <T>(res: Response, options: SendResponseOptions<T>) => {
  const { statusCode, success, message, data } = options;
  res.status(statusCode).json({ success, message, data });
};

export default sendResponse;
