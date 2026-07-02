import { RequestHandler, Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { SampleServices } from "./sample.services";

const createSample: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await SampleServices.createSample(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Sample created successfully",
    data: result,
  });
});

const getAllSamples: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const result = await SampleServices.getAllSamples();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Samples retrieved successfully",
    data: result,
  });
});

const getSampleById: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await SampleServices.getSampleById(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sample retrieved successfully",
    data: result,
  });
});

const updateSample: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await SampleServices.updateSample(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sample updated successfully",
    data: result,
  });
});

const deleteSample: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await SampleServices.deleteSample(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sample deleted successfully",
    data: result,
  });
});

export const SampleControllers = {
  createSample,
  getAllSamples,
  getSampleById,
  updateSample,
  deleteSample,
};
