import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { ChecklistControllers } from "./checklist.controllers";
import {
  createChecklistValidator,
  updateChecklistValidator,
  reorderChecklistsValidator,
  addItemValidator,
  updateItemValidator,
  reorderItemsValidator,
} from "./checklist.validation";

const router = express.Router();

router.use(authMiddleware);

router.get("/", ChecklistControllers.getChecklists);
router.post("/", validatorMiddleware(createChecklistValidator), ChecklistControllers.createChecklist);
router.put("/reorder", validatorMiddleware(reorderChecklistsValidator), ChecklistControllers.reorderChecklists);
router.patch("/:checklistId", validatorMiddleware(updateChecklistValidator), ChecklistControllers.updateChecklist);
router.delete("/:checklistId", ChecklistControllers.deleteChecklist);

router.post("/:checklistId/items", validatorMiddleware(addItemValidator), ChecklistControllers.addItem);
router.patch("/:checklistId/items/:itemId", validatorMiddleware(updateItemValidator), ChecklistControllers.updateItem);
router.delete("/:checklistId/items/:itemId", ChecklistControllers.deleteItem);
router.put("/:checklistId/items/reorder", validatorMiddleware(reorderItemsValidator), ChecklistControllers.reorderItems);

export const ChecklistRoutes = router;
