import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { ChecklistServices } from "./checklist.services";

const getUserId = (req: AuthRequest) => req.user!.id;
const getChecklistId = (req: Request) => req.params.checklistId as string;
const getItemId = (req: Request) => req.params.itemId as string;

const getChecklists: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.getChecklists(getUserId(req as AuthRequest));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checklists retrieved successfully",
    data: result,
  });
});

const createChecklist: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.createChecklist(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Checklist created successfully",
    data: result,
  });
});

const updateChecklist: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.updateChecklist(
    getUserId(req as AuthRequest),
    getChecklistId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checklist updated successfully",
    data: result,
  });
});

const deleteChecklist: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.deleteChecklist(
    getUserId(req as AuthRequest),
    getChecklistId(req)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checklist deleted successfully",
    data: result,
  });
});

const reorderChecklists: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.reorderChecklists(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checklists reordered successfully",
    data: result,
  });
});

const addItem: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.addItem(
    getUserId(req as AuthRequest),
    getChecklistId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Item added successfully",
    data: result,
  });
});

const updateItem: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.updateItem(
    getUserId(req as AuthRequest),
    getChecklistId(req),
    getItemId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Item updated successfully",
    data: result,
  });
});

const deleteItem: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.deleteItem(
    getUserId(req as AuthRequest),
    getChecklistId(req),
    getItemId(req)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Item deleted successfully",
    data: result,
  });
});

const reorderItems: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await ChecklistServices.reorderItems(
    getUserId(req as AuthRequest),
    getChecklistId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Items reordered successfully",
    data: result,
  });
});

export const ChecklistControllers = {
  getChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  reorderChecklists,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
};
