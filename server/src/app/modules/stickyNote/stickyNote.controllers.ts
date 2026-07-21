import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { AuthRequest } from "../../middlewares/authMiddleware";
import catchAsync from "../../utils/asyncCatch";
import sendResponse from "../../utils/sendResponse";
import { StickyNoteServices } from "./stickyNote.services";

const getUserId = (req: AuthRequest) => req.user!.id;
const getGroupId = (req: Request) => req.params.groupId as string;
const getNoteId = (req: Request) => req.params.noteId as string;

// ─── Groups ───────────────────────────────────────────────

const getGroups: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.getGroups(getUserId(req as AuthRequest));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Groups retrieved successfully",
    data: result,
  });
});

const createGroup: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.createGroup(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Group created successfully",
    data: result,
  });
});

const renameGroup: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.renameGroup(
    getUserId(req as AuthRequest),
    getGroupId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group renamed successfully",
    data: result,
  });
});

const deleteGroup: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  await StickyNoteServices.deleteGroup(getUserId(req as AuthRequest), getGroupId(req));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group deleted successfully",
  });
});

const reorderGroups: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.reorderGroups(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Groups reordered successfully",
    data: result,
  });
});

// ─── Notes ────────────────────────────────────────────────

const getNotes: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.query.groupId as string | undefined;
  const result = await StickyNoteServices.getNotes(getUserId(req as AuthRequest), groupId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notes retrieved successfully",
    data: result,
  });
});

const createNote: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.createNote(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Note created successfully",
    data: result,
  });
});

const updateNote: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.updateNote(
    getUserId(req as AuthRequest),
    getNoteId(req),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note updated successfully",
    data: result,
  });
});

const deleteNote: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  await StickyNoteServices.deleteNote(getUserId(req as AuthRequest), getNoteId(req));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note deleted successfully",
  });
});

const reorderNotes: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await StickyNoteServices.reorderNotes(getUserId(req as AuthRequest), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notes reordered successfully",
    data: result,
  });
});

// ─── Share ────────────────────────────────────────────────

const generateNoteShareLink: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const nanoid = await StickyNoteServices.generateNoteShareNanoid(
    getUserId(req as AuthRequest),
    getNoteId(req)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Share link generated successfully",
    data: { nanoid },
  });
});

const getSharedNote: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const nanoid = req.params.nanoid as string;
  const result = await StickyNoteServices.getNoteByNanoid(nanoid);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shared note retrieved successfully",
    data: result,
  });
});

export const StickyNoteControllers = {
  getGroups,
  createGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  reorderNotes,
  generateNoteShareLink,
  getSharedNote,
};
