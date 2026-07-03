import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface Column {
  id: string;
  key: string;
  label: string;
  order: number;
  workspaceId: string;
}

interface ColumnsState {
  items: Column[];
  currentWorkspaceId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: ColumnsState = {
  items: [],
  currentWorkspaceId: null,
  isLoading: false,
  lastFetched: null,
  error: null,
};

interface ApiColumn {
  _id: string;
  key: string;
  label: string;
  order?: number;
  workspace: string;
}

const mapColumn = (column: ApiColumn): Column => ({
  id: column._id,
  key: column.key,
  label: column.label,
  order: column.order ?? 0,
  workspaceId: column.workspace,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export const fetchColumns = createAsyncThunk<
  { workspaceId: string; columns: Column[] },
  { teamId: string; workspaceId: string },
  { rejectValue: string }
>("columns/fetchColumns", async ({ teamId, workspaceId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/teams/${teamId}/workspaces/${workspaceId}/columns`);
    return {
      workspaceId,
      columns: (response.data.data as ApiColumn[]).map(mapColumn),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load columns"));
  }
});

export const replaceColumns = createAsyncThunk<
  { workspaceId: string; columns: Column[] },
  { teamId: string; workspaceId: string; columns: Array<{ key: string; label: string }> },
  { rejectValue: string }
>(
  "columns/replaceColumns",
  async ({ teamId, workspaceId, columns }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(
        `/teams/${teamId}/workspaces/${workspaceId}/columns`,
        { columns }
      );
      return {
        workspaceId,
        columns: (response.data.data as ApiColumn[]).map(mapColumn),
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update columns"));
    }
  }
);

const columnsSlice = createSlice({
  name: "columns",
  initialState,
  reducers: {
    setColumns: (
      state,
      action: PayloadAction<{ workspaceId: string; columns: Column[] }>
    ) => {
      state.currentWorkspaceId = action.payload.workspaceId;
      state.items = action.payload.columns;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    setColumnsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearColumnsError: (state) => {
      state.error = null;
    },
    clearColumns: (state) => {
      state.items = [];
      state.currentWorkspaceId = null;
      state.isLoading = false;
      state.lastFetched = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchColumns.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        if (state.currentWorkspaceId !== action.meta.arg.workspaceId) {
          state.currentWorkspaceId = action.meta.arg.workspaceId;
          state.items = [];
          state.lastFetched = null;
        }
      })
      .addCase(fetchColumns.fulfilled, (state, action) => {
        state.currentWorkspaceId = action.payload.workspaceId;
        state.items = action.payload.columns;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchColumns.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load columns";
      })
      .addCase(replaceColumns.fulfilled, (state, action) => {
        state.currentWorkspaceId = action.payload.workspaceId;
        state.items = action.payload.columns;
        state.error = null;
      })
      .addCase(replaceColumns.rejected, (state, action) => {
        state.error = action.payload || "Failed to update columns";
      });
  },
});

export const {
  setColumns,
  setColumnsLoading,
  clearColumnsError,
  clearColumns,
} = columnsSlice.actions;
export default columnsSlice.reducer;
