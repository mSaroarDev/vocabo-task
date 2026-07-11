import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createChecklistGroup,
  renameChecklistGroup,
  deleteChecklistGroup,
  reorderChecklistGroups,
  addChecklistItem,
  toggleChecklistItem,
  editChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  type ChecklistGroup,
} from "@/store/slices/checklistSlice";

export function useChecklist() {
  const dispatch = useAppDispatch();
  const { groups, isLoading, error } = useAppSelector((state) => state.checklist);

  return {
    groups,
    isLoading,
    error,
    createGroup: useCallback(
      (title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(createChecklistGroup(clean));
      },
      [dispatch],
    ),
    renameGroup: useCallback(
      (id: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(renameChecklistGroup({ id, title: clean }));
      },
      [dispatch],
    ),
    deleteGroup: useCallback(
      (id: string) => dispatch(deleteChecklistGroup(id)),
      [dispatch],
    ),
    reorderGroups: useCallback(
      (orderedIds: string[]) => dispatch(reorderChecklistGroups(orderedIds)),
      [dispatch],
    ),

    addItem: useCallback(
      (groupId: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(addChecklistItem({ groupId, title: clean }));
      },
      [dispatch],
    ),
    toggleItem: useCallback(
      (groupId: string, itemId: string) => dispatch(toggleChecklistItem({ groupId, itemId })),
      [dispatch],
    ),
    editItem: useCallback(
      (groupId: string, itemId: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(editChecklistItem({ groupId, itemId, title: clean }));
      },
      [dispatch],
    ),
    deleteItem: useCallback(
      (groupId: string, itemId: string) => dispatch(deleteChecklistItem({ groupId, itemId })),
      [dispatch],
    ),
    reorderItems: useCallback(
      (groupId: string, itemIds: string[]) =>
        dispatch(reorderChecklistItems({ groupId, itemIds })),
      [dispatch],
    ),
  };
}

export type { ChecklistGroup };
