import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearWorkspaces as clearWorkspacesAction,
  createWorkspace as createWorkspaceAction,
  deleteWorkspace as deleteWorkspaceAction,
  fetchWorkspaces as fetchWorkspacesAction,
  reorderWorkspaceItems,
  reorderWorkspaces as reorderWorkspacesAction,
  updateWorkspace as updateWorkspaceAction,
  setWorkspaces as setWorkspacesAction,
  type Workspace,
} from "@/store/slices/workspacesSlice";

export function useWorkspaces(teamId?: string | null) {
  const dispatch = useAppDispatch();
  const { items, currentTeamId, isLoading, lastFetched, error } = useAppSelector(
    (state) => state.workspaces
  );

  const shouldRefetch = useMemo(() => {
    if (!teamId) return false;
    if (currentTeamId !== teamId) return true;
    if (!lastFetched) return true;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [currentTeamId, lastFetched, teamId]);

  useEffect(() => {
    if (!teamId) {
      dispatch(clearWorkspacesAction());
      return;
    }

    if (shouldRefetch) {
      dispatch(fetchWorkspacesAction({ teamId }));
    }
  }, [dispatch, shouldRefetch, teamId]);

  return {
    workspaces: currentTeamId === teamId ? items : [],
    isLoading,
    error,
    shouldRefetch,
    fetchWorkspaces: async () => {
      if (!teamId) return [];
      const result = await dispatch(fetchWorkspacesAction({ teamId })).unwrap();
      return result.workspaces;
    },
    addWorkspace: async (name: string, icon = "briefcase", color = "#6b7280") => {
      if (!teamId) return null;
      const cleanName = name.trim();
      if (!cleanName) return null;
      return dispatch(createWorkspaceAction({ teamId, name: cleanName, icon, color })).unwrap();
    },
    updateWorkspace: async (id: string, name: string, icon?: string, color?: string) => {
      if (!teamId) return null;
      const cleanName = name.trim();
      if (!cleanName) return null;
      try {
        return await dispatch(updateWorkspaceAction({ teamId, id, name: cleanName, icon, color })).unwrap();
      } catch (error) {
        dispatch(fetchWorkspacesAction({ teamId }));
        throw error;
      }
    },
    removeWorkspace: async (id: string) => {
      if (!teamId) return null;
      return dispatch(deleteWorkspaceAction({ teamId, id })).unwrap();
    },
    reorderWorkspaces: async (workspaceIds: string[]) => {
      if (!teamId) return null;
      dispatch(reorderWorkspaceItems(workspaceIds));
      try {
        return await dispatch(reorderWorkspacesAction({ teamId, workspaceIds })).unwrap();
      } catch (error) {
        dispatch(fetchWorkspacesAction({ teamId }));
        throw error;
      }
    },
    setWorkspaces: (workspaces: Workspace[]) =>
      teamId && dispatch(setWorkspacesAction({ teamId, workspaces })),
  };
}
