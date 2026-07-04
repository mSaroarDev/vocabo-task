import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  addItem,
  toggleItem,
  editItem,
  deleteItem,
  reorderItems,
  type ChecklistGroup,
} from "@/store/slices/checklistSlice";

export function useChecklist() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector((state) => state.checklist.groups);

  return {
    groups,
    createGroup: useCallback(
      (title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(addGroup(clean));
      },
      [dispatch],
    ),
    renameGroup: useCallback(
      (id: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(renameGroup({ id, title: clean }));
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

    addItem: useCallback(
      (groupId: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(addItem(groupId, clean));
      },
      [dispatch],
    ),
    toggleItem: useCallback(
      (groupId: string, itemId: string) => dispatch(toggleItem({ groupId, itemId })),
      [dispatch],
    ),
    editItem: useCallback(
      (groupId: string, itemId: string, title: string) => {
        const clean = title.trim();
        if (!clean) return;
        dispatch(editItem({ groupId, itemId, title: clean }));
      },
      [dispatch],
    ),
    deleteItem: useCallback(
      (groupId: string, itemId: string) => dispatch(deleteItem({ groupId, itemId })),
      [dispatch],
    ),
    reorderItems: useCallback(
      (groupId: string, itemIds: string[]) => dispatch(reorderItems({ groupId, itemIds })),
      [dispatch],
    ),
  };
}

export type { ChecklistGroup };
