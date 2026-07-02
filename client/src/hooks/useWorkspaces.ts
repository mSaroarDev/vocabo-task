import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addWorkspace as addWorkspaceAction,
  updateWorkspace as updateWorkspaceAction,
  removeWorkspace as removeWorkspaceAction,
  setWorkspaces as setWorkspacesAction,
  type Workspace,
} from "@/store/slices/workspacesSlice";

export function useWorkspaces() {
  const dispatch = useAppDispatch();
  const { items, isLoading, lastFetched } = useAppSelector(
    (state) => state.workspaces
  );

  const shouldRefetch = useMemo(() => {
    if (!lastFetched) return true;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [lastFetched]);

  return {
    workspaces: items,
    isLoading,
    shouldRefetch,
    addWorkspace: (name: string) => {
      const newWorkspace: Workspace = {
        id: String(Date.now()),
        name,
        icon: "briefcase",
      };
      dispatch(addWorkspaceAction(newWorkspace));
      return newWorkspace;
    },
    updateWorkspace: (id: string, name: string) => {
      dispatch(updateWorkspaceAction({ id, name }));
    },
    removeWorkspace: (id: string) => {
      dispatch(removeWorkspaceAction(id));
    },
    setWorkspaces: (workspaces: Workspace[]) =>
      dispatch(setWorkspacesAction(workspaces)),
  };
}