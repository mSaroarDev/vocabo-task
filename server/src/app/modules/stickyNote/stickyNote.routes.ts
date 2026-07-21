import express from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import validatorMiddleware from "../../middlewares/validatorMiddleware";
import { StickyNoteControllers } from "./stickyNote.controllers";
import {
  createGroupValidator,
  renameGroupValidator,
  reorderGroupsValidator,
  createNoteValidator,
  updateNoteValidator,
  reorderNotesValidator,
} from "./stickyNote.validation";

const router = express.Router();

// Public route (no auth)
router.get("/share/:nanoid", StickyNoteControllers.getSharedNote);

router.use(authMiddleware);

// Groups
router.get("/groups", StickyNoteControllers.getGroups);
router.post("/groups", validatorMiddleware(createGroupValidator), StickyNoteControllers.createGroup);
router.patch("/groups/:groupId", validatorMiddleware(renameGroupValidator), StickyNoteControllers.renameGroup);
router.delete("/groups/:groupId", StickyNoteControllers.deleteGroup);
router.put("/groups/reorder", validatorMiddleware(reorderGroupsValidator), StickyNoteControllers.reorderGroups);

// Notes
router.get("/notes", StickyNoteControllers.getNotes);
router.post("/notes", validatorMiddleware(createNoteValidator), StickyNoteControllers.createNote);
router.patch("/notes/:noteId", validatorMiddleware(updateNoteValidator), StickyNoteControllers.updateNote);
router.delete("/notes/:noteId", StickyNoteControllers.deleteNote);
router.put("/notes/reorder", validatorMiddleware(reorderNotesValidator), StickyNoteControllers.reorderNotes);
router.post("/notes/:noteId/share", StickyNoteControllers.generateNoteShareLink);

export const StickyNoteRoutes = router;
