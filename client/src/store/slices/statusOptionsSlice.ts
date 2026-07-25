import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { StatusOption } from "@/components/table/types";

const keyFor = (teamId: string, workspaceId: string) => `${teamId}|${workspaceId}`;

interface StatusOptionsState {
  byKey: Record<string, StatusOption[]>;
}

const initialState: StatusOptionsState = {
  byKey: {},
};

const statusOptionsSlice = createSlice({
  name: "statusOptions",
  initialState,
  reducers: {
    setStatusOptions: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; options: StatusOption[] }>
    ) => {
      state.byKey[keyFor(action.payload.teamId, action.payload.workspaceId)] = action.payload.options;
    },
    addStatusOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; option: StatusOption }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      state.byKey[k] = [...list, action.payload.option];
    },
    replaceStatusOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; id: string; option: StatusOption }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      const index = list.findIndex((o) => o._id === action.payload.id);
      if (index !== -1) {
        const next = [...list];
        next[index] = action.payload.option;
        state.byKey[k] = next;
      } else {
        state.byKey[k] = [...list, action.payload.option];
      }
    },
    updateStatusOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; id: string; label: string; color: string }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      state.byKey[k] = list.map((o) =>
        o._id === action.payload.id
          ? { ...o, label: action.payload.label, color: action.payload.color }
          : o
      );
    },
    deleteStatusOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; id: string }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      state.byKey[k] = list.filter((o) => o._id !== action.payload.id);
    },
    reorderStatusOptions: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; orderedIds: string[] }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      const map = new Map(list.map((o) => [o._id, o]));
      const reordered = action.payload.orderedIds
        .map((id) => map.get(id))
        .filter((o): o is StatusOption => Boolean(o));
      const missing = list.filter((o) => !action.payload.orderedIds.includes(o._id!));
      state.byKey[k] = [...reordered, ...missing];
    },
  },
});

export const {
  setStatusOptions,
  addStatusOption,
  replaceStatusOption,
  updateStatusOption,
  deleteStatusOption,
  reorderStatusOptions,
} = statusOptionsSlice.actions;

export default statusOptionsSlice.reducer;
