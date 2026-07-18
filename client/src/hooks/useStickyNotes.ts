import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  addNote,
  updateNote,
  deleteNote,
  pinNote,
  setNoteColor,
  reorderNotes,
  genId,
  type StickyNoteGroup,
  type StickyNote,
} from "@/store/slices/stickyNotesSlice";

export function useStickyNotes() {
  const dispatch = useAppDispatch();
  const { groups, notes } = useAppSelector((state) => state.stickyNotes);

  return {
    groups,
    notes,

    createGroup: useCallback(
      (name: string) => {
        const clean = name.trim();
        if (!clean) return;
        dispatch(addGroup(clean));
      },
      [dispatch],
    ),

    renameGroup: useCallback(
      (id: string, name: string) => {
        const clean = name.trim();
        if (!clean) return;
        dispatch(renameGroup({ id, name: clean }));
      },
      [dispatch],
    ),

    deleteGroup: useCallback(
      (id: string) => dispatch(deleteGroup(id)),
      [dispatch],
    ),

    reorderGroups: useCallback(
      (orderedIds: string[]) => dispatch(reorderGroups(orderedIds)),
      [dispatch],
    ),

    createNote: useCallback(
      (groupId: string, title: string, content?: string, color?: string) => {
        const id = genId();
        const now = Date.now();
        dispatch(addNote({
          id,
          groupId,
          title: title.trim(),
          content: (content || "").trim(),
          color: color || "#ffffff",
          isPinned: false,
          createdAt: now,
          updatedAt: now,
        }));
        return id;
      },
      [dispatch],
    ),

    editNote: useCallback(
      (id: string, title: string, content: string) => {
        dispatch(updateNote({ id, title, content }));
      },
      [dispatch],
    ),

    removeNote: useCallback(
      (id: string) => dispatch(deleteNote(id)),
      [dispatch],
    ),

    togglePin: useCallback(
      (id: string) => dispatch(pinNote(id)),
      [dispatch],
    ),

    changeNoteColor: useCallback(
      (id: string, color: string) => dispatch(setNoteColor({ id, color })),
      [dispatch],
    ),

    reorderNotes: useCallback(
      (groupId: string, noteIds: string[]) =>
        dispatch(reorderNotes({ groupId, noteIds })),
      [dispatch],
    ),

    getNoteById: useCallback(
      (id: string) => notes.find((n) => n.id === id),
      [notes],
    ),

    getGroupById: useCallback(
      (id: string) => groups.find((g) => g.id === id),
      [groups],
    ),

    getNotesByGroup: useCallback(
      (groupId: string) => {
        const groupNotes = notes.filter((n) => n.groupId === groupId);
        const pinned = groupNotes.filter((n) => n.isPinned);
        const unpinned = groupNotes.filter((n) => !n.isPinned);
        return [...pinned, ...unpinned];
      },
      [notes],
    ),
  };
}

export type { StickyNoteGroup, StickyNote };
