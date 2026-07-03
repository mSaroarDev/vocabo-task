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

interface ApiTask {
  _id: string;
  title: string;
  status: string;
  priority: Task["priority"];
  isCompleted: boolean;
  description?: string;
  banner?: string;
  attachments: ApiAttachment[];
  createdBy: ApiUser;
  assignedTo?: ApiUser;
  customFields: Record<string, unknown>;
  order: number;
}

function mapTask(task: ApiTask): Task {
  const toPerson = (user: ApiUser) => ({
    name: user.name,
    initials: getInitials(user.name),
    color: getColor(user.name),
  });

  return {
    id: task._id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    isCompleted: task.isCompleted,
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
  { teamId: string; workspaceId: string; data: Partial<Task> },
  { rejectValue: string }
>("tasks/createTask", async ({ teamId, workspaceId, data }, { rejectWithValue }) => {
  try {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
    };
    const response = await apiClient.post(`/teams/${teamId}/workspaces/${workspaceId}/tasks`, payload);
    return mapTask(response.data.data as ApiTask);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to create task"));
  }
});

export const updateTask = createAsyncThunk<
  Task,
  { teamId: string; workspaceId: string; taskId: string; data: Partial<Task> },
  { rejectValue: string }
>("tasks/updateTask", async ({ teamId, workspaceId, taskId, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`,
      data
    );
    return mapTask(response.data.data as ApiTask);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to update task"));
  }
});

export const deleteTask = createAsyncThunk<
  string,
  { teamId: string; workspaceId: string; taskId: string },
  { rejectValue: string }
>("tasks/deleteTask", async ({ teamId, workspaceId, taskId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}`);
    return taskId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to delete task"));
  }
});

export const reorderTasks = createAsyncThunk<
  { workspaceId: string; tasks: Task[] },
  { teamId: string; workspaceId: string; taskIds: string[] },
  { rejectValue: string }
>("tasks/reorderTasks", async ({ teamId, workspaceId, taskIds }, { rejectWithValue }) => {
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
    return rejectWithValue(getErrorMessage(error, "Failed to reorder tasks"));
  }
});

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
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
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

export const { setTasks, clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
