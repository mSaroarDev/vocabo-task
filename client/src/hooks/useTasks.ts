import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTasks,
  fetchTasks as fetchTasksAction,
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  reorderTasks as reorderTasksAction,
  archiveTasks as archiveTasksAction,
  setTasks as setTasksAction,
} from "@/store/slices/tasksSlice";
import type { Task } from "@/components/table/notion-table";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useTasks(teamId?: string | null, workspaceId?: string | null) {
  const dispatch = useAppDispatch();
  const { items, currentWorkspaceId, isLoading, lastFetched, error } = useAppSelector(
    (state) => state.tasks
  );

  const shouldFetch = useMemo(() => {
    if (!teamId || !workspaceId) return false;
    if (currentWorkspaceId !== workspaceId) return true;
    if (!lastFetched) return true;
    return Date.now() - lastFetched > FIVE_MINUTES;
  }, [currentWorkspaceId, lastFetched, teamId, workspaceId]);

  useEffect(() => {
    if (!teamId || !workspaceId) {
      dispatch(clearTasks());
      return;
    }

    if (shouldFetch) {
      dispatch(fetchTasksAction({ teamId, workspaceId }));
    }
  }, [dispatch, shouldFetch, teamId, workspaceId]);

  const tasks: Task[] = currentWorkspaceId === workspaceId ? items : [];

  const addTask = useCallback(
    (data: Partial<Task>, pendingAttachments?: File[]) => {
      if (!teamId || !workspaceId) return;
      dispatch(createTaskAction({ teamId, workspaceId, data, pendingAttachments }));
    },
    [dispatch, teamId, workspaceId]
  );

  const editTask = useCallback(
    async (taskId: string, data: Partial<Task>, optimisticData?: any) => {
      if (!teamId || !workspaceId) return null;
      try {
        return await dispatch(
          updateTaskAction({ teamId, workspaceId, taskId, data, optimisticData })
        ).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch, teamId, workspaceId]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!teamId || !workspaceId) return null;
      try {
        return await dispatch(
          deleteTaskAction({ teamId, workspaceId, taskId })
        ).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch, teamId, workspaceId]
  );

  const reorder = useCallback(
    async (taskIds: string[], optimisticTasks?: Task[]) => {
      if (!teamId || !workspaceId) return null;
      try {
        return await dispatch(
          reorderTasksAction({ teamId, workspaceId, taskIds, optimisticTasks })
        ).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch, teamId, workspaceId]
  );

  const archiveTask = useCallback(
    async (taskIds: string[], isArchived: boolean) => {
      if (!teamId || !workspaceId) return null;
      try {
        return await dispatch(
          archiveTasksAction({ teamId, workspaceId, taskIds, isArchived })
        ).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch, teamId, workspaceId]
  );

  const setTasks = useCallback(
    (tasks: Task[]) => {
      if (!workspaceId) return;
      dispatch(setTasksAction({ workspaceId, tasks }));
    },
    [dispatch, workspaceId]
  );

  return {
    tasks,
    isLoading,
    error,
    shouldFetch,
    addTask,
    editTask,
    removeTask,
    reorder,
    archiveTask,
    setTasks,
  };
}
