import axios from "axios";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";
import type { Task } from "@/components/table/notion-table";

interface TasksState {
  items: Task[];
  currentWorkspaceId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  currentWorkspaceId: null,
  isLoading: false,
  lastFetched: null,
  error: null,
};

const avatarColors = [
  "bg-red-500/20 text-red-300",
  "bg-blue-500/20 text-blue-300",
  "bg-green-500/20 text-green-300",
  "bg-purple-500/20 text-purple-300",
  "bg-amber-500/20 text-amber-300",
  "bg-pink-500/20 text-pink-300",
  "bg-cyan-500/20 text-cyan-300",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ApiAttachment {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ApiTask {
  _id: string;
  title: string;
  status: string;
  priority: Task["priority"];
  isCompleted: boolean;
  isArchived?: boolean;
  description?: string;
  banner?: string;
  attachments: ApiAttachment[];
  createdBy: ApiUser;
  assignedTo?: ApiUser;
  customFields: Record<string, unknown>;
  workspace: string;
  workspaceName?: string;
  createdAt?: string;
  order: number;
}

export function mapTask(task: ApiTask): Task {
  const toPerson = (user: ApiUser) => ({
    name: user.name,
    initials: getInitials(user.name),
    color: getColor(user.name),
    avatar: user.avatar,
  });

  return {
    id: task._id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    isCompleted: task.isCompleted,
    isArchived: task.isArchived,
    description: task.description,
    banner: task.banner,
    attachments: (task.attachments || []).map((a) => ({
      id: a._id,
      filename: a.filename,
      originalName: a.originalName,
      url: a.url,
      size: a.size,
      mimeType: a.mimeType,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt,
    })),
    createdBy: toPerson(task.createdBy),
    assignedTo: task.assignedTo ? toPerson(task.assignedTo) : { name: "Unassigned", initials: "Un", color: avatarColors[1] },
    customFields: task.customFields ?? {},
    workspaceId: task.workspace,
    workspaceName: task.workspaceName,
    createdAt: task.createdAt,
  };
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export const fetchTasks = createAsyncThunk<
  { workspaceId: string; tasks: Task[] },
  { teamId: string; workspaceId: string },
  { rejectValue: string }
>("tasks/fetchTasks", async ({ teamId, workspaceId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/teams/${teamId}/workspaces/${workspaceId}/tasks`);
    return {
      workspaceId,
      tasks: (response.data.data as ApiTask[]).map(mapTask),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load tasks"));
  }
});

export const createTask = createAsyncThunk<
  Task,
  {
    teamId: string;
    workspaceId: string;
    data: Partial<Task>;
    pendingAttachments?: File[];
  },
  { state: { auth: { user: { name: string } | null } }; rejectValue: string }
>(
  "tasks/createTask",
  async (
    { teamId, workspaceId, data, pendingAttachments },
    { dispatch, rejectWithValue, getState }
  ) => {
    const currentUser = getState().auth.user;
    const userName = currentUser?.name || "Unknown";
    const tempId = `temp_${crypto.randomUUID()}`;
    const tempTask: Task = {
      id: tempId,
      title: data.title || "Untitled",
      status: data.status || "New",
      priority: data.priority || "None",
      isCompleted: false,
      description: data.description,
      attachments: [],
      createdBy: {
        name: userName,
        initials: getInitials(userName),
        color: getColor(userName),
      },
      assignedTo: {
        name: "Unassigned",
        initials: "Un",
        color: "bg-blue-500/20 text-blue-300",
      },
      customFields: {},
      isPending: true,
    };

    dispatch(addOptimisticTask(tempTask));

    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
      };
      const response = await apiClient.post(
        `/teams/${teamId}/workspaces/${workspaceId}/tasks`,
        payload
      );
      const realTask = mapTask(response.data.data as ApiTask);

      if (pendingAttachments && pendingAttachments.length > 0) {
        const token = localStorage.getItem("token");
        for (const file of pendingAttachments) {
          try {
            const formData = new FormData();
            formData.append("attachments", file);
            const attachRes = await axios({
              method: "post",
              url: `${apiClient.defaults.baseURL}/teams/${teamId}/workspaces/${workspaceId}/tasks/${realTask.id}/attachments`,
              data: formData,
              headers: {
                Authorization: token ? `Bearer ${token}` : undefined,
              },
            });
            const updated = mapTask(attachRes.data.data as ApiTask);
            dispatch(confirmOptimisticTask({ tempId, realTask: updated }));
          } catch {
            // individual attachment upload failure — continue
          }
        }
      } else {
        dispatch(confirmOptimisticTask({ tempId, realTask }));
      }

      return realTask;
    } catch (error) {
      dispatch(removeOptimisticTask(tempId));
      return rejectWithValue(
        getErrorMessage(error, "Failed to create task")
      );
    }
  }
);

export const archiveTasks = createAsyncThunk<
  { taskIds: string[]; isArchived: boolean },
  { teamId: string; workspaceId: string; taskIds: string[]; isArchived: boolean },
  { state: { tasks: TasksState }; rejectValue: string }
>("tasks/archiveTasks", async ({ teamId, workspaceId, taskIds, isArchived }, { dispatch, getState, rejectWithValue }) => {
  const previous = getState().tasks.items.filter((t) => taskIds.includes(t.id));
  previous.forEach((t) =>
    dispatch(applyOptimisticUpdate({ taskId: t.id, updates: { isArchived } }))
  );

  try {
    await apiClient.patch(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/archive`,
      { taskIds, isArchived }
    );
    return { taskIds, isArchived };
  } catch (error) {
    previous.forEach((t) =>
      dispatch(revertTaskUpdate({ taskId: t.id, previousState: t }))
    );
    return rejectWithValue(getErrorMessage(error, "Failed to archive tasks"));
  }
});

export const updateTask = createAsyncThunk<
  Task,
  { teamId: string; workspaceId: string; taskId: string; data: Partial<Task>; optimisticData?: any },
  { state: { tasks: TasksState }; rejectValue: string }
>(
  "tasks/updateTask",
  async (
    { teamId, workspaceId, taskId, data, optimisticData },
    { dispatch, getState, rejectWithValue }
  ) => {
    const task = getState().tasks.items.find((t) => t.id === taskId);
    if (task) {
      dispatch(applyOptimisticUpdate({ taskId, updates: optimisticData || data }));
    }

    try {
      const response = await apiClient.patch(
        `/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`,
        data
      );
      return mapTask(response.data.data as ApiTask);
    } catch (error) {
      if (task) {
        dispatch(revertTaskUpdate({ taskId, previousState: task }));
      }
      return rejectWithValue(getErrorMessage(error, "Failed to update task"));
    }
  }
);

export const deleteTask = createAsyncThunk<
  string,
  { teamId: string; workspaceId: string; taskId: string },
  { state: { tasks: TasksState }; rejectValue: string }
>("tasks/deleteTask", async ({ teamId, workspaceId, taskId }, { dispatch, getState, rejectWithValue }) => {
  const task = getState().tasks.items.find((t) => t.id === taskId);
  if (task) {
    dispatch(removeOptimisticTask(taskId));
  }

  try {
    await apiClient.delete(`/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`);
    return taskId;
  } catch (error) {
    if (task) {
      dispatch(restoreDeletedTask(task));
    }
    return rejectWithValue(getErrorMessage(error, "Failed to delete task"));
  }
});

export const reorderTasks = createAsyncThunk<
  { workspaceId: string; tasks: Task[] },
  { teamId: string; workspaceId: string; taskIds: string[]; optimisticTasks?: Task[] },
  { state: { tasks: TasksState }; rejectValue: string }
>("tasks/reorderTasks", async ({ teamId, workspaceId, taskIds, optimisticTasks }, { dispatch, getState, rejectWithValue }) => {
  const previousTasks = getState().tasks.items;
  
  if (optimisticTasks) {
    dispatch(setTasks({ workspaceId, tasks: optimisticTasks }));
  }

  try {
    const response = await apiClient.patch(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/reorder`,
      { taskIds }
    );
    return {
      workspaceId,
      tasks: (response.data.data as ApiTask[]).map(mapTask),
    };
  } catch (error) {
    if (optimisticTasks) {
      dispatch(setTasks({ workspaceId, tasks: previousTasks }));
    }
    return rejectWithValue(getErrorMessage(error, "Failed to reorder tasks"));
  }
});

export const addTaskAttachment = createAsyncThunk<
  Task,
  { teamId: string; workspaceId: string; taskId: string; file: File },
  { rejectValue: string }
>("tasks/addTaskAttachment", async ({ teamId, workspaceId, taskId, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("attachments", file);
    const token = localStorage.getItem("token");
    const response = await axios({
      method: "post",
      url: `${apiClient.defaults.baseURL}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}/attachments`,
      data: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return mapTask(response.data.data as ApiTask);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to upload attachment"));
  }
});

export const deleteTaskAttachment = createAsyncThunk<
  Task,
  { teamId: string; workspaceId: string; taskId: string; attachmentId: string },
  { rejectValue: string }
>(
  "tasks/deleteTaskAttachment",
  async ({ teamId, workspaceId, taskId, attachmentId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios({
        method: "delete",
        url: `${apiClient.defaults.baseURL}/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}/attachments/${attachmentId}`,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return mapTask(response.data.data as ApiTask);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete attachment"));
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<{ workspaceId: string; tasks: Task[] }>) => {
      state.currentWorkspaceId = action.payload.workspaceId;
      state.items = action.payload.tasks;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    clearTasks: (state) => {
      state.items = [];
      state.currentWorkspaceId = null;
      state.isLoading = false;
      state.lastFetched = null;
      state.error = null;
    },
    addOptimisticTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    removeOptimisticTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    confirmOptimisticTask: (
      state,
      action: PayloadAction<{ tempId: string; realTask: Task }>
    ) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.tempId);
      if (idx !== -1) {
        state.items[idx] = action.payload.realTask;
      }
      state.error = null;
    },
    applyOptimisticUpdate: (
      state,
      action: PayloadAction<{ taskId: string; updates: Partial<Task> }>
    ) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.taskId);
      if (idx !== -1) {
        Object.assign(state.items[idx], action.payload.updates);
      }
    },
    revertTaskUpdate: (
      state,
      action: PayloadAction<{ taskId: string; previousState: Task }>
    ) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.taskId);
      if (idx !== -1) {
        state.items[idx] = action.payload.previousState;
      }
    },
    restoreDeletedTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        if (state.currentWorkspaceId !== action.meta.arg.workspaceId) {
          state.currentWorkspaceId = action.meta.arg.workspaceId;
          state.items = [];
          state.lastFetched = null;
        }
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.currentWorkspaceId = action.payload.workspaceId;
        state.items = action.payload.tasks;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load tasks";
      })
      .addCase(createTask.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to create task";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to update task";
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete task";
      })
      .addCase(archiveTasks.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(archiveTasks.rejected, (state, action) => {
        state.error = action.payload || "Failed to archive tasks";
      })
      .addCase(addTaskAttachment.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        state.error = null;
      })
      .addCase(addTaskAttachment.rejected, (state, action) => {
        state.error = action.payload || "Failed to upload attachment";
      })
      .addCase(deleteTaskAttachment.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        state.error = null;
      })
      .addCase(deleteTaskAttachment.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete attachment";
      })
      .addCase(reorderTasks.fulfilled, (state, action) => {
        if (state.currentWorkspaceId === action.payload.workspaceId) {
          state.items = action.payload.tasks;
        }
        state.error = null;
      })
      .addCase(reorderTasks.rejected, (state, action) => {
        state.error = action.payload || "Failed to reorder tasks";
      });
  },
});

export const {
  setTasks,
  clearTasks,
  addOptimisticTask,
  removeOptimisticTask,
  confirmOptimisticTask,
  applyOptimisticUpdate,
  revertTaskUpdate,
  restoreDeletedTask,
} = tasksSlice.actions;
export default tasksSlice.reducer;
