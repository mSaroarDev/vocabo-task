import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PriorityOption } from "@/components/table/types";

const keyFor = (teamId: string, workspaceId: string) => `${teamId}|${workspaceId}`;

interface PriorityOptionsState {
  byKey: Record<string, PriorityOption[]>;
}

const initialState: PriorityOptionsState = {
  byKey: {},
};

const priorityOptionsSlice = createSlice({
  name: "priorityOptions",
  initialState,
  reducers: {
    setPriorityOptions: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; options: PriorityOption[] }>
    ) => {
      state.byKey[keyFor(action.payload.teamId, action.payload.workspaceId)] = action.payload.options;
    },
    addPriorityOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; option: PriorityOption }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      state.byKey[k] = [...list, action.payload.option];
    },
    replacePriorityOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; id: string; option: PriorityOption }>
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
    updatePriorityOption: (
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
    deletePriorityOption: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; id: string }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      state.byKey[k] = list.filter((o) => o._id !== action.payload.id);
    },
    reorderPriorityOptions: (
      state,
      action: PayloadAction<{ teamId: string; workspaceId: string; orderedIds: string[] }>
    ) => {
      const k = keyFor(action.payload.teamId, action.payload.workspaceId);
      const list = state.byKey[k] ?? [];
      const map = new Map(list.map((o) => [o._id, o]));
      const reordered = action.payload.orderedIds
        .map((id) => map.get(id))
        .filter((o): o is PriorityOption => Boolean(o));
      const missing = list.filter((o) => !action.payload.orderedIds.includes(o._id!));
      state.byKey[k] = [...reordered, ...missing];
    },
  },
});

export const {
  setPriorityOptions,
  addPriorityOption,
  replacePriorityOption,
  updatePriorityOption,
  deletePriorityOption,
  reorderPriorityOptions,
} = priorityOptionsSlice.actions;

export default priorityOptionsSlice.reducer;
