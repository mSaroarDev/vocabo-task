import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearColumns as clearColumnsAction,
  fetchColumns as fetchColumnsAction,
  replaceColumns as replaceColumnsAction,
  setColumns as setColumnsAction,
  type Column,
} from "@/store/slices/columnsSlice";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useColumns(teamId?: string | null, workspaceId?: string | null) {
  const dispatch = useAppDispatch();
  const { items, currentWorkspaceId, isLoading, lastFetched, error } = useAppSelector(
    (state) => state.columns
  );

  const shouldFetch = useMemo(() => {
    if (!teamId || !workspaceId) return false;
    if (currentWorkspaceId !== workspaceId) return true;
    if (!lastFetched) return true;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [currentWorkspaceId, lastFetched, teamId, workspaceId]);

  useEffect(() => {
    if (!teamId || !workspaceId) {
      dispatch(clearColumnsAction());
      return;
    }

    if (shouldFetch) {
      dispatch(fetchColumnsAction({ teamId, workspaceId }));
    }
  }, [dispatch, shouldFetch, teamId, workspaceId]);

  const columns: Column[] = currentWorkspaceId === workspaceId ? items : [];

  const replaceColumns = useCallback(
    async (next: Array<{ key: string; label: string }>) => {
      if (!teamId || !workspaceId) return null;
      try {
        return await dispatch(
          replaceColumnsAction({ teamId, workspaceId, columns: next })
        ).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch, teamId, workspaceId]
  );

  const addColumn = useCallback(
    async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return null;
      const key = `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const next = [...columns, { key, label: trimmed }];
      return replaceColumns(next);
    },
    [columns, replaceColumns]
  );

  const renameColumn = useCallback(
    async (key: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return null;
      const next = columns.map((c) => (c.key === key ? { key, label: trimmed } : { key: c.key, label: c.label }));
      return replaceColumns(next);
    },
    [columns, replaceColumns]
  );

  const removeColumn = useCallback(
    async (key: string) => {
      const next = columns
        .filter((c) => c.key !== key)
        .map((c) => ({ key: c.key, label: c.label }));
      return replaceColumns(next);
    },
    [columns, replaceColumns]
  );

  const reorderColumns = useCallback(
    async (orderedKeys: string[]) => {
      const byKey = new Map(columns.map((c) => [c.key, c]));
      const next = orderedKeys
        .map((key) => byKey.get(key))
        .filter((c): c is Column => Boolean(c))
        .map((c) => ({ key: c.key, label: c.label }));
      return replaceColumns(next);
    },
    [columns, replaceColumns]
  );

  const setColumns = useCallback(
    (next: Column[]) => {
      if (!workspaceId) return;
      dispatch(setColumnsAction({ workspaceId, columns: next }));
    },
    [dispatch, workspaceId]
  );

  return {
    columns,
    isLoading,
    error,
    shouldFetch,
    addColumn,
    renameColumn,
    removeColumn,
    reorderColumns,
    replaceColumns,
    setColumns,
  };
}
