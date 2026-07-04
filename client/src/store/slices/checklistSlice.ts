import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
  order: number;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
  order: number;
}

interface ChecklistState {
  groups: ChecklistGroup[];
}

const initialState: ChecklistState = {
  groups: [],
};

const genId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

function deduplicate(state: ChecklistState) {
  for (const group of state.groups) {
    const seen = new Set<string>();
    group.items = group.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }
}

const checklistSlice = createSlice({
  name: "checklist",
  initialState,
  reducers: {
    addGroup: {
      reducer: (state, action: PayloadAction<ChecklistGroup>) => {
        state.groups.push(action.payload);
      },
      prepare: (title: string) => ({
        payload: {
          id: genId(),
          title,
          items: [],
          order: 0,
        },
      }),
    },
    renameGroup: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const group = state.groups.find((g) => g.id === action.payload.id);
      if (group) group.title = action.payload.title;
    },
    deleteGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((g) => g.id !== action.payload);
    },
    reorderGroups: (state, action: PayloadAction<string[]>) => {
      const groupMap = new Map(state.groups.map((g) => [g.id, g]));
      state.groups = action.payload
        .map((id, index) => {
          const group = groupMap.get(id);
          return group ? { ...group, order: index } : null;
        })
        .filter((g): g is ChecklistGroup => g !== null);
    },

    addItem: {
      reducer: (state, action: PayloadAction<{ groupId: string; item: ChecklistItem }>) => {
        const group = state.groups.find((g) => g.id === action.payload.groupId);
        if (group) {
          group.items.push(action.payload.item);
        }
      },
      prepare: (groupId: string, title: string) => {
        const id = genId();
        return {
          payload: {
            groupId,
            item: { id, title, checked: false, order: 0 },
          },
        };
      },
    },
    toggleItem: (state, action: PayloadAction<{ groupId: string; itemId: string }>) => {
      deduplicate(state);
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (!group) return;
      const item = group.items.find((i) => i.id === action.payload.itemId);
      if (item) item.checked = !item.checked;
    },
    editItem: (
      state,
      action: PayloadAction<{ groupId: string; itemId: string; title: string }>,
    ) => {
      deduplicate(state);
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (!group) return;
      const item = group.items.find((i) => i.id === action.payload.itemId);
      if (item) item.title = action.payload.title;
    },
    deleteItem: (state, action: PayloadAction<{ groupId: string; itemId: string }>) => {
      deduplicate(state);
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (group) {
        group.items = group.items.filter((i) => i.id !== action.payload.itemId);
      }
    },
    reorderItems: (
      state,
      action: PayloadAction<{ groupId: string; itemIds: string[] }>,
    ) => {
      deduplicate(state);
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (!group) return;
      const itemMap = new Map(group.items.map((i) => [i.id, i]));
      group.items = action.payload.itemIds
        .map((id, index) => {
          const item = itemMap.get(id);
          return item ? { ...item, order: index } : null;
        })
        .filter((i): i is ChecklistItem => i !== null);
    },
  },
});

export const {
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  addItem,
  toggleItem,
  editItem,
  deleteItem,
  reorderItems,
} = checklistSlice.actions;
export default checklistSlice.reducer;
