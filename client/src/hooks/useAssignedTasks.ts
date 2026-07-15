import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/api/client";
import { mapTask, type ApiTask } from "@/store/slices/tasksSlice";
import type { Task } from "@/components/table/notion-table";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isCancel(error)) return "";
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export function useAssignedTasks(teamId?: string | null, userId?: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setTasks([]);
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);
    setError(null);

    const url =
      userId && userId !== "me"
        ? `/teams/${teamId}/tasks/assigned-to-me?userId=${encodeURIComponent(userId)}`
        : `/teams/${teamId}/tasks/assigned-to-me`;

    apiClient
      .get(url, { signal: abortController.signal })
      .then((response) => {
        setTasks((response.data.data as ApiTask[]).map(mapTask));
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(getErrorMessage(err, "Failed to fetch assigned tasks"));
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [teamId, userId]);

  const editTask = useCallback(
    async (taskId: string, data: Partial<Task>, optimisticData?: Task) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!teamId || !task?.workspaceId) return null;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...(optimisticData ?? data) } : t))
      );

      try {
        const response = await apiClient.patch(
          `/teams/${teamId}/workspaces/${task.workspaceId}/tasks/${taskId}`,
          data
        );
        const updated = (response.data.data as ApiTask);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? mapTask(updated) : t))
        );
        return mapTask(updated);
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
        throw new Error(getErrorMessage(err, "Failed to update task"));
      }
    },
    [teamId, tasks]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!teamId || !task?.workspaceId) return null;

      const previous = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        await apiClient.delete(
          `/teams/${teamId}/workspaces/${task.workspaceId}/tasks/${taskId}`
        );
        return task;
      } catch (err) {
        setTasks(previous);
        throw new Error(getErrorMessage(err, "Failed to delete task"));
      }
    },
    [teamId, tasks]
  );

  const archiveTask = useCallback(
    async (taskIds: string[], isArchived: boolean) => {
      if (!teamId) return;

      const workspaceGroups = new Map<string, string[]>();
      for (const id of taskIds) {
        const task = tasks.find((t) => t.id === id);
        if (!task?.workspaceId) continue;
        const list = workspaceGroups.get(task.workspaceId) ?? [];
        list.push(id);
        workspaceGroups.set(task.workspaceId, list);
      }

      const previous = tasks;
      setTasks((prev) =>
        prev.map((t) =>
          taskIds.includes(t.id) ? { ...t, isArchived } : t
        )
      );

      try {
        await Promise.all(
          Array.from(workspaceGroups.entries()).map(([workspaceId, ids]) =>
            apiClient.patch(
              `/teams/${teamId}/workspaces/${workspaceId}/tasks/archive`,
              { taskIds: ids, isArchived }
            )
          )
        );
      } catch (err) {
        setTasks(previous);
        throw new Error(getErrorMessage(err, "Failed to archive tasks"));
      }
    },
    [teamId, tasks]
  );

  const reorder = useCallback(
    async (taskIds: string[], optimisticTasks?: Task[]): Promise<{ workspaceId: string; tasks: Task[] } | null> => {
      if (!teamId) return null;

      const previous = tasks;
      if (optimisticTasks) {
        setTasks(optimisticTasks);
      }

      try {
        const response = await apiClient.patch(
          `/teams/${teamId}/tasks/reorder-assigned`,
          { taskIds }
        );
        const mapped = (response.data.data as ApiTask[]).map(mapTask);
        setTasks(mapped);
        return { workspaceId: "", tasks: mapped };
      } catch (err) {
        setTasks(previous);
        throw new Error(getErrorMessage(err, "Failed to reorder tasks"));
      }
    },
    [teamId, tasks]
  );

  return {
    tasks,
    isLoading,
    error,
    editTask,
    removeTask,
    archiveTask,
    reorder,
  };
}
