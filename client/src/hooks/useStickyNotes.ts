import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchStickyNotes,
  createStickyGroup,
  renameStickyGroup,
  deleteStickyGroup,
  reorderStickyGroups,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
  reorderStickyNotes,
  type StickyNoteGroup,
  type StickyNote,
} from "@/store/slices/stickyNotesSlice";

export function useStickyNotes() {
  const dispatch = useAppDispatch();
  const { groups, notes, isLoading, error } = useAppSelector((state) => state.stickyNotes);

  return {
    groups,
    notes,
    isLoading,
    error,

    loadAll: useCallback(() => {
      dispatch(fetchStickyNotes());
    }, [dispatch]),

    createGroup: useCallback(
      (name: string) => {
        const clean = name.trim();
        if (!clean) return;
        dispatch(createStickyGroup(clean));
      },
      [dispatch],
    ),

    renameGroup: useCallback(
      (id: string, name: string) => {
        const clean = name.trim();
        if (!clean) return;
        dispatch(renameStickyGroup({ id, name: clean }));
      },
      [dispatch],
    ),

    deleteGroup: useCallback(
      (id: string) => dispatch(deleteStickyGroup(id)),
      [dispatch],
    ),

    reorderGroups: useCallback(
      (orderedIds: string[]) => dispatch(reorderStickyGroups(orderedIds)),
      [dispatch],
    ),

    createNote: useCallback(
      (groupId: string, title: string, content?: string, color?: string) => {
        const id = crypto.randomUUID();
        dispatch(
          createStickyNote({
            id,
            groupId,
            title: title.trim(),
            content: (content || "").trim(),
            color: color || "#ffffff",
          })
        );
        return id;
      },
      [dispatch],
    ),

    editNote: useCallback(
      (id: string, title: string, content: string) => {
        dispatch(updateStickyNote({ id, changes: { title: title.trim(), content: content.trim() } }));
      },
      [dispatch],
    ),

    removeNote: useCallback(
      (id: string) => dispatch(deleteStickyNote(id)),
      [dispatch],
    ),

    togglePin: useCallback(
      (id: string) => {
        const note = notes.find((n) => n.id === id);
        if (note) dispatch(updateStickyNote({ id, changes: { isPinned: !note.isPinned } }));
      },
      [dispatch, notes],
    ),

    changeNoteColor: useCallback(
      (id: string, color: string) => dispatch(updateStickyNote({ id, changes: { color } })),
      [dispatch],
    ),

    reorderNotes: useCallback(
      (groupId: string, noteIds: string[]) =>
        dispatch(reorderStickyNotes({ groupId, noteIds })),
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
