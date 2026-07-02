import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface WorkspacesState {
  items: Workspace[];
  isLoading: boolean;
  lastFetched: number | null;
}

const defaultWorkspaces: Workspace[] = [
  { id: "7", name: "Marketing", icon: "briefcase" },
  { id: "8", name: "Development", icon: "briefcase" },
  { id: "9", name: "Design", icon: "briefcase" },
];

const initialState: WorkspacesState = {
  items: defaultWorkspaces,
  isLoading: false,
  lastFetched: null,
};

const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.items.push(action.payload);
    },
    updateWorkspace: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      const ws = state.items.find((w) => w.id === action.payload.id);
      if (ws) ws.name = action.payload.name;
    },
    removeWorkspace: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((w) => w.id !== action.payload);
    },
    setWorkspacesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearWorkspaces: (state) => {
      state.items = [];
      state.lastFetched = null;
    },
  },
});

export const {
  setWorkspaces,
  addWorkspace,
  updateWorkspace,
  removeWorkspace,
  setWorkspacesLoading,
  clearWorkspaces,
} = workspacesSlice.actions;
export default workspacesSlice.reducer;