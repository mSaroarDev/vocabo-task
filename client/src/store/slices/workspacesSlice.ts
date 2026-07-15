import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  teamId: string;
}

interface WorkspacesState {
  items: Workspace[];
  currentTeamId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: WorkspacesState = {
  items: [],
  currentTeamId: null,
  isLoading: false,
  lastFetched: null,
  error: null,
};

interface ApiWorkspace {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  order?: number;
  team: string;
}

const mapWorkspace = (workspace: ApiWorkspace): Workspace => ({
  id: workspace._id,
  name: workspace.name,
  icon: workspace.icon || "briefcase",
  color: workspace.color || "#6b7280",
  order: workspace.order || 0,
  teamId: workspace.team,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export const fetchWorkspaces = createAsyncThunk<
  { teamId: string; workspaces: Workspace[] },
  { teamId: string },
  { rejectValue: string }
>("workspaces/fetchWorkspaces", async ({ teamId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/teams/${teamId}/workspaces`);
    return {
      teamId,
      workspaces: (response.data.data as ApiWorkspace[]).map(mapWorkspace),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load workspaces"));
  }
});

export const createWorkspace = createAsyncThunk<
  Workspace,
  { teamId: string; name: string; icon?: string; color?: string },
  { rejectValue: string }
>("workspaces/createWorkspace", async ({ teamId, name, icon, color }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post(`/teams/${teamId}/workspaces`, { name, icon, color });
    return mapWorkspace(response.data.data as ApiWorkspace);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to create workspace"));
  }
});

export const updateWorkspace = createAsyncThunk<
  Workspace,
  { teamId: string; id: string; name: string; icon?: string; color?: string },
  { rejectValue: string }
>("workspaces/updateWorkspace", async ({ teamId, id, name, icon, color }, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(`/teams/${teamId}/workspaces/${id}`, { name, icon, color });
    return mapWorkspace(response.data.data as ApiWorkspace);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to update workspace"));
  }
});

export const deleteWorkspace = createAsyncThunk<
  { teamId: string; id: string },
  { teamId: string; id: string },
  { rejectValue: string }
>("workspaces/deleteWorkspace", async ({ teamId, id }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/teams/${teamId}/workspaces/${id}`);
    return { teamId, id };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to delete workspace"));
  }
});

export const reorderWorkspaces = createAsyncThunk<
  { teamId: string; workspaces: Workspace[] },
  { teamId: string; workspaceIds: string[] },
  { rejectValue: string }
>("workspaces/reorderWorkspaces", async ({ teamId, workspaceIds }, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(`/teams/${teamId}/workspaces/reorder`, {
      workspaceIds,
    });
    return {
      teamId,
      workspaces: (response.data.data as ApiWorkspace[]).map(mapWorkspace),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to reorder workspaces"));
  }
});

const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<{ teamId: string; workspaces: Workspace[] }>) => {
      state.currentTeamId = action.payload.teamId;
      state.items = action.payload.workspaces;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    setWorkspaceItems: (state, action: PayloadAction<Workspace[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    reorderWorkspaceItems: (state, action: PayloadAction<string[]>) => {
      const workspaceById = new Map(state.items.map((workspace) => [workspace.id, workspace]));
      state.items = action.payload
        .map((workspaceId, index) => {
          const workspace = workspaceById.get(workspaceId);
          return workspace ? { ...workspace, order: index } : null;
        })
        .filter((workspace): workspace is Workspace => Boolean(workspace));
    },
    setWorkspacesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearWorkspacesError: (state) => {
      state.error = null;
    },
    clearWorkspaces: (state) => {
      state.items = [];
      state.currentTeamId = null;
      state.isLoading = false;
      state.lastFetched = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        if (state.currentTeamId !== action.meta.arg.teamId) {
          state.currentTeamId = action.meta.arg.teamId;
          state.items = [];
          state.lastFetched = null;
        }
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.currentTeamId = action.payload.teamId;
        state.items = action.payload.workspaces;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load workspaces";
      })
      .addCase(createWorkspace.pending, (state, action) => {
        state.error = null;
        const tempId = `temp_${action.meta.requestId}`;
        state.items.push({
          id: tempId,
          name: action.meta.arg.name,
          icon: action.meta.arg.icon || "briefcase",
          color: action.meta.arg.color || "#6b7280",
          order: state.items.length,
          teamId: action.meta.arg.teamId,
        });
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        const tempId = `temp_${action.meta.requestId}`;
        state.items = state.items.filter((item) => item.id !== tempId);
        if (state.currentTeamId === action.payload.teamId) {
          state.items.push(action.payload);
          state.items.sort((a, b) => a.order - b.order);
        }
        state.error = null;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        const tempId = `temp_${action.meta.requestId}`;
        state.items = state.items.filter((item) => item.id !== tempId);
        state.error = action.payload || "Failed to create workspace";
      })
      .addCase(updateWorkspace.pending, (state, action) => {
        state.error = null;
        const workspace = state.items.find((item) => item.id === action.meta.arg.id);
        if (workspace && state.currentTeamId === action.meta.arg.teamId) {
          if (action.meta.arg.name) workspace.name = action.meta.arg.name;
          if (action.meta.arg.icon) workspace.icon = action.meta.arg.icon;
          if (action.meta.arg.color) workspace.color = action.meta.arg.color;
        }
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const workspace = state.items.find((item) => item.id === action.payload.id);
        if (workspace && state.currentTeamId === action.payload.teamId) {
          workspace.name = action.payload.name;
          workspace.icon = action.payload.icon;
          workspace.color = action.payload.color;
        }
        state.error = null;
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.error = action.payload || "Failed to update workspace";
      })
      .addCase(deleteWorkspace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        if (state.currentTeamId === action.payload.teamId) {
          state.items = state.items.filter((item) => item.id !== action.payload.id);
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete workspace";
      })
      .addCase(reorderWorkspaces.fulfilled, (state, action) => {
        if (state.currentTeamId === action.payload.teamId) {
          state.items = action.payload.workspaces;
        }
        state.error = null;
      })
      .addCase(reorderWorkspaces.rejected, (state, action) => {
        state.error = action.payload || "Failed to reorder workspaces";
      });
  },
});

export const {
  setWorkspaces,
  setWorkspaceItems,
  reorderWorkspaceItems,
  setWorkspacesLoading,
  clearWorkspacesError,
  clearWorkspaces,
} = workspacesSlice.actions;
export default workspacesSlice.reducer;
