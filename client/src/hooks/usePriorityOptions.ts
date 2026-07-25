import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setPriorityOptions,
  addPriorityOption,
  replacePriorityOption,
  updatePriorityOption as updatePriorityOptionAction,
  deletePriorityOption as deletePriorityOptionAction,
  reorderPriorityOptions as reorderPriorityOptionsAction,
} from "@/store/slices/priorityOptionsSlice";
import {
  getPriorityOptions,
  createPriorityOption,
  updatePriorityOption,
  deletePriorityOption,
  reorderPriorityOptions,
} from "@/services/priorityOptionsApi";
import type { PriorityOption } from "@/components/table/types";

const keyFor = (teamId: string, workspaceId: string) => `${teamId}|${workspaceId}`;

export function usePriorityOptions(teamId?: string | null, workspaceId?: string | null) {
  const dispatch = useAppDispatch();

  const options = useAppSelector((state) =>
    teamId && workspaceId ? state.priorityOptions.byKey[keyFor(teamId, workspaceId)] ?? [] : []
  );

  const optionsRef = useRef<PriorityOption[]>(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const refetch = useCallback(async () => {
    if (!teamId || !workspaceId) return;
    try {
      const data = await getPriorityOptions(teamId, workspaceId);
      dispatch(setPriorityOptions({ teamId, workspaceId, options: data }));
    } catch {
      // keep existing state on failure
    }
  }, [teamId, workspaceId, dispatch]);

  const create = useCallback(
    async (label: string, color: string) => {
      if (!teamId || !workspaceId) return;
      const tempId = `temp-prio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: PriorityOption = { _id: tempId, label, color };
      dispatch(addPriorityOption({ teamId, workspaceId, option: optimistic }));
      try {
        const created = await createPriorityOption(teamId, workspaceId, { label, color });
        dispatch(replacePriorityOption({ teamId, workspaceId, id: tempId, option: created }));
      } catch {
        dispatch(deletePriorityOptionAction({ teamId, workspaceId, id: tempId }));
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const update = useCallback(
    async (optionId: string, label: string, color: string) => {
      if (!teamId || !workspaceId) return;
      dispatch(updatePriorityOptionAction({ teamId, workspaceId, id: optionId, label, color }));
      try {
        const updated = await updatePriorityOption(teamId, workspaceId, optionId, { label, color });
        dispatch(replacePriorityOption({ teamId, workspaceId, id: optionId, option: updated }));
      } catch {
        const prev = optionsRef.current.find((o) => o._id === optionId);
        if (prev) {
          dispatch(updatePriorityOptionAction({ teamId, workspaceId, id: optionId, label: prev.label, color: prev.color }));
        }
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const remove = useCallback(
    async (optionId: string) => {
      if (!teamId || !workspaceId) return;
      const removed = optionsRef.current.find((o) => o._id === optionId);
      dispatch(deletePriorityOptionAction({ teamId, workspaceId, id: optionId }));
      try {
        await deletePriorityOption(teamId, workspaceId, optionId);
      } catch {
        if (removed) {
          dispatch(addPriorityOption({ teamId, workspaceId, option: removed }));
        }
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      if (!teamId || !workspaceId) return;
      const prev = optionsRef.current;
      dispatch(reorderPriorityOptionsAction({ teamId, workspaceId, orderedIds }));
      try {
        const updated = await reorderPriorityOptions(teamId, workspaceId, orderedIds);
        dispatch(setPriorityOptions({ teamId, workspaceId, options: updated }));
      } catch {
        dispatch(setPriorityOptions({ teamId, workspaceId, options: prev }));
      }
    },
    [teamId, workspaceId, dispatch]
  );

  return { options, create, update, remove, reorder, refetch };
}
