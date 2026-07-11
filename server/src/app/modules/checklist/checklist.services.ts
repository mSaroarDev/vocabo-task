import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import ChecklistModel from "./checklist.model";

const getChecklists = async (userId: string) => {
  return ChecklistModel.find({ user: userId }).sort({ order: 1, createdAt: 1 });
};

const createChecklist = async (userId: string, payload: { title: string; id: string }) => {
  const lastChecklist = await ChecklistModel.findOne({ user: userId }).sort({ order: -1 });

  const result = await ChecklistModel.create({
    _id: payload.id,
    user: userId,
    title: payload.title.trim(),
    order: lastChecklist ? lastChecklist.order + 1 : 0,
    items: [],
  });

  return result;
};

const updateChecklist = async (userId: string, checklistId: string, payload: { title: string }) => {
  const result = await ChecklistModel.findOneAndUpdate(
    { _id: checklistId, user: userId },
    { title: payload.title.trim() },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  return result;
};

const deleteChecklist = async (userId: string, checklistId: string) => {
  const result = await ChecklistModel.findOneAndDelete({ _id: checklistId, user: userId });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  return result;
};

const reorderChecklists = async (userId: string, payload: { ids: string[] }) => {
  const uniqueIds = [...new Set(payload.ids)];
  if (uniqueIds.length !== payload.ids.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Checklist order contains duplicates");
  }

  const [count, matchingCount] = await Promise.all([
    ChecklistModel.countDocuments({ user: userId }),
    ChecklistModel.countDocuments({ _id: { $in: uniqueIds }, user: userId }),
  ]);

  if (matchingCount !== uniqueIds.length || count !== uniqueIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "Checklist order is invalid");
  }

  await ChecklistModel.bulkWrite(
    uniqueIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order: index } },
      },
    }))
  );

  return ChecklistModel.find({ user: userId }).sort({ order: 1, createdAt: 1 });
};

const addItem = async (
  userId: string,
  checklistId: string,
  payload: { title: string; itemId: string }
) => {
  const checklist = await ChecklistModel.findOne({ _id: checklistId, user: userId });

  if (!checklist) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  const maxOrder = checklist.items.reduce((max, i) => Math.max(max, i.order), -1);

  checklist.items.push({
    itemId: payload.itemId,
    title: payload.title.trim(),
    checked: false,
    order: maxOrder + 1,
  });

  await checklist.save();
  return checklist;
};

const updateItem = async (
  userId: string,
  checklistId: string,
  itemId: string,
  payload: { title?: string; checked?: boolean }
) => {
  const checklist = await ChecklistModel.findOne({ _id: checklistId, user: userId });

  if (!checklist) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  const item = checklist.items.find((i) => i.itemId === itemId);
  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, "Item not found");
  }

  if (payload.title !== undefined) item.title = payload.title.trim();
  if (payload.checked !== undefined) item.checked = payload.checked;

  await checklist.save();
  return checklist;
};

const deleteItem = async (userId: string, checklistId: string, itemId: string) => {
  const checklist = await ChecklistModel.findOne({ _id: checklistId, user: userId });

  if (!checklist) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  const idx = checklist.items.findIndex((i) => i.itemId === itemId);
  if (idx === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Item not found");
  }

  checklist.items.splice(idx, 1);
  await checklist.save();
  return checklist;
};

const reorderItems = async (
  userId: string,
  checklistId: string,
  payload: { itemIds: string[] }
) => {
  const checklist = await ChecklistModel.findOne({ _id: checklistId, user: userId });

  if (!checklist) {
    throw new AppError(httpStatus.NOT_FOUND, "Checklist not found");
  }

  const itemMap = new Map(checklist.items.map((i) => [i.itemId, i]));
  const reordered = payload.itemIds.map((id, index) => {
    const item = itemMap.get(id);
    if (!item) {
      throw new AppError(httpStatus.BAD_REQUEST, `Item ${id} not found`);
    }
    return { ...item, order: index };
  });

  checklist.items = reordered;
  await checklist.save();
  return checklist;
};

export const ChecklistServices = {
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
