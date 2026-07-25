import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setStatusOptions,
  addStatusOption,
  replaceStatusOption,
  updateStatusOption as updateStatusOptionAction,
  deleteStatusOption as deleteStatusOptionAction,
  reorderStatusOptions as reorderStatusOptionsAction,
} from "@/store/slices/statusOptionsSlice";
import {
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  reorderStatusOptions,
} from "@/services/statusOptionsApi";
import type { StatusOption } from "@/components/table/types";

const keyFor = (teamId: string, workspaceId: string) => `${teamId}|${workspaceId}`;

export function useStatusOptions(teamId?: string | null, workspaceId?: string | null) {
  const dispatch = useAppDispatch();

  const options = useAppSelector((state) =>
    teamId && workspaceId ? state.statusOptions.byKey[keyFor(teamId, workspaceId)] ?? [] : []
  );

  const optionsRef = useRef<StatusOption[]>(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const refetch = useCallback(async () => {
    if (!teamId || !workspaceId) return;
    try {
      const data = await getStatusOptions(teamId, workspaceId);
      dispatch(setStatusOptions({ teamId, workspaceId, options: data }));
    } catch {
      // keep existing state on failure
    }
  }, [teamId, workspaceId, dispatch]);

  const create = useCallback(
    async (label: string, color: string) => {
      if (!teamId || !workspaceId) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: StatusOption = { _id: tempId, label, color };
      dispatch(addStatusOption({ teamId, workspaceId, option: optimistic }));
      try {
        const created = await createStatusOption(teamId, workspaceId, { label, color });
        dispatch(replaceStatusOption({ teamId, workspaceId, id: tempId, option: created }));
      } catch {
        dispatch(deleteStatusOptionAction({ teamId, workspaceId, id: tempId }));
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const update = useCallback(
    async (optionId: string, label: string, color: string) => {
      if (!teamId || !workspaceId) return;
      dispatch(updateStatusOptionAction({ teamId, workspaceId, id: optionId, label, color }));
      try {
        const updated = await updateStatusOption(teamId, workspaceId, optionId, { label, color });
        dispatch(replaceStatusOption({ teamId, workspaceId, id: optionId, option: updated }));
      } catch {
        const prev = optionsRef.current.find((o) => o._id === optionId);
        if (prev) {
          dispatch(updateStatusOptionAction({ teamId, workspaceId, id: optionId, label: prev.label, color: prev.color }));
        }
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const remove = useCallback(
    async (optionId: string) => {
      if (!teamId || !workspaceId) return;
      const removed = optionsRef.current.find((o) => o._id === optionId);
      dispatch(deleteStatusOptionAction({ teamId, workspaceId, id: optionId }));
      try {
        await deleteStatusOption(teamId, workspaceId, optionId);
      } catch {
        if (removed) {
          dispatch(addStatusOption({ teamId, workspaceId, option: removed }));
        }
      }
    },
    [teamId, workspaceId, dispatch]
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      if (!teamId || !workspaceId) return;
      const prev = optionsRef.current;
      dispatch(reorderStatusOptionsAction({ teamId, workspaceId, orderedIds }));
      try {
        const updated = await reorderStatusOptions(teamId, workspaceId, orderedIds);
        dispatch(setStatusOptions({ teamId, workspaceId, options: updated }));
      } catch {
        dispatch(setStatusOptions({ teamId, workspaceId, options: prev }));
      }
    },
    [teamId, workspaceId, dispatch]
  );

  return { options, create, update, remove, reorder, refetch };
}
