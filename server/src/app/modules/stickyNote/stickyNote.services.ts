import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { StickyNoteGroupModel, StickyNoteModel } from "./stickyNote.model";

// ─── Groups ───────────────────────────────────────────────

const getGroups = async (userId: string) => {
  return StickyNoteGroupModel.find({ user: userId }).sort({ order: 1, createdAt: 1 });
};

const createGroup = async (userId: string, payload: { name: string; id: string }) => {
  const lastGroup = await StickyNoteGroupModel.findOne({ user: userId }).sort({ order: -1 });

  const group = await StickyNoteGroupModel.create({
    _id: payload.id,
    user: userId,
    name: payload.name.trim(),
    order: lastGroup ? lastGroup.order + 1 : 0,
  });

  return group;
};

const renameGroup = async (userId: string, groupId: string, payload: { name: string }) => {
  const group = await StickyNoteGroupModel.findOneAndUpdate(
    { _id: groupId, user: userId },
    { name: payload.name.trim() },
    { new: true, runValidators: true }
  );

  if (!group) throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  return group;
};

const deleteGroup = async (userId: string, groupId: string) => {
  const group = await StickyNoteGroupModel.findOneAndDelete({ _id: groupId, user: userId });
  if (!group) throw new AppError(httpStatus.NOT_FOUND, "Group not found");

  await StickyNoteModel.deleteMany({ groupId, user: userId });
  return group;
};

const reorderGroups = async (userId: string, payload: { ids: string[] }) => {
  const uniqueIds = [...new Set(payload.ids)];
  if (uniqueIds.length !== payload.ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group order contains duplicates");
  }

  const [count, matchingCount] = await Promise.all([
    StickyNoteGroupModel.countDocuments({ user: userId }),
    StickyNoteGroupModel.countDocuments({ _id: { $in: uniqueIds }, user: userId }),
  ]);

  if (matchingCount !== uniqueIds.length || count !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group order is invalid");
  }

  await StickyNoteGroupModel.bulkWrite(
    uniqueIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order: index } },
      },
    }))
  );

  return StickyNoteGroupModel.find({ user: userId }).sort({ order: 1, createdAt: 1 });
};

// ─── Notes ────────────────────────────────────────────────

const getNotes = async (userId: string, groupId?: string) => {
  const filter: Record<string, unknown> = { user: userId };
  if (groupId) filter.groupId = groupId;

  return StickyNoteModel.find(filter).sort({ isPinned: -1, order: 1, createdAt: 1 });
};

const createNote = async (
  userId: string,
  payload: { groupId: string; title: string; content: string; color: string; id: string }
) => {
  const group = await StickyNoteGroupModel.findOne({ _id: payload.groupId, user: userId });
  if (!group) throw new AppError(httpStatus.NOT_FOUND, "Group not found");

  const lastNote = await StickyNoteModel.findOne({ user: userId, groupId: payload.groupId }).sort({ order: -1 });

  const note = await StickyNoteModel.create({
    _id: payload.id,
    user: userId,
    groupId: payload.groupId,
    title: payload.title,
    content: payload.content,
    color: payload.color || "#ffffff",
    isPinned: false,
    order: lastNote ? lastNote.order + 1 : 0,
  });

  return note;
};

const updateNote = async (
  userId: string,
  noteId: string,
  payload: { title?: string; content?: string; color?: string; isPinned?: boolean }
) => {
  const note = await StickyNoteModel.findOne({ _id: noteId, user: userId });
  if (!note) throw new AppError(httpStatus.NOT_FOUND, "Note not found");

  if (payload.title !== undefined) note.title = payload.title;
  if (payload.content !== undefined) note.content = payload.content;
  if (payload.color !== undefined) note.color = payload.color;
  if (payload.isPinned !== undefined) note.isPinned = payload.isPinned;

  await note.save();
  return note;
};

const deleteNote = async (userId: string, noteId: string) => {
  const note = await StickyNoteModel.findOneAndDelete({ _id: noteId, user: userId });
  if (!note) throw new AppError(httpStatus.NOT_FOUND, "Note not found");
  return note;
};

const reorderNotes = async (
  userId: string,
  payload: { groupId: string; noteIds: string[] }
) => {
  const uniqueIds = [...new Set(payload.noteIds)];
  if (uniqueIds.length !== payload.noteIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Note order contains duplicates");
  }

  const [count, matchingCount] = await Promise.all([
    StickyNoteModel.countDocuments({ user: userId, groupId: payload.groupId }),
    StickyNoteModel.countDocuments({ _id: { $in: uniqueIds }, user: userId, groupId: payload.groupId }),
  ]);

  if (matchingCount !== uniqueIds.length || count !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Note order is invalid");
  }

  await StickyNoteModel.bulkWrite(
    uniqueIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order: index } },
      },
    }))
  );

  return StickyNoteModel.find({ user: userId, groupId: payload.groupId }).sort({
    isPinned: -1,
    order: 1,
    createdAt: 1,
  });
};

export const StickyNoteServices = {
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
};
