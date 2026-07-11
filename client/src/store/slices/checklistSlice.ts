import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

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
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: ChecklistState = {
  groups: [],
  isLoading: false,
  lastFetched: null,
  error: null,
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

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

function mapGroup(doc: any): ChecklistGroup {
  return {
    id: doc._id,
    title: doc.title,
    order: doc.order,
    items: (doc.items || []).map((item: any) => ({
      id: item.itemId,
      title: item.title,
      checked: item.checked,
      order: item.order,
    })),
  };
}

export const fetchChecklist = createAsyncThunk<
  ChecklistGroup[],
  void,
  { rejectValue: string }
>("checklist/fetchChecklist", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/checklist");
    const data = response.data.data;
    return (Array.isArray(data) ? data : []).map(mapGroup);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load checklist"));
  }
});

export const createChecklistGroup = createAsyncThunk<
  { tempId: string; title: string },
  string,
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/createGroup", async (title, { getState, dispatch, rejectWithValue }) => {
  const tempId = genId();
  const { groups } = getState().checklist;
  const maxOrder = groups.reduce((max, g) => Math.max(max, g.order), -1);
  dispatch(addGroup({ id: tempId, title, items: [], order: maxOrder + 1 }));

  try {
    await apiClient.post("/checklist", { title, id: tempId });
    return { tempId, title };
  } catch (error) {
    dispatch(deleteGroup(tempId));
    return rejectWithValue(getErrorMessage(error, "Failed to create group"));
  }
});

export const renameChecklistGroup = createAsyncThunk<
  { id: string; title: string },
  { id: string; title: string },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/renameGroup", async ({ id, title }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().checklist.groups.find((g) => g.id === id)?.title;
  dispatch(renameGroup({ id, title }));

  try {
    await apiClient.patch(`/checklist/${id}`, { title });
    return { id, title };
  } catch (error) {
    if (prev !== undefined) {
      dispatch(renameGroup({ id, title: prev }));
    }
    return rejectWithValue(getErrorMessage(error, "Failed to rename group"));
  }
});

export const deleteChecklistGroup = createAsyncThunk<
  string,
  string,
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/deleteGroup", async (id, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().checklist.groups;
  dispatch(deleteGroup(id));

  try {
    await apiClient.delete(`/checklist/${id}`);
    return id;
  } catch (error) {
    dispatch(setChecklistGroups(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to delete group"));
  }
});

export const reorderChecklistGroups = createAsyncThunk<
  string[],
  string[],
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/reorderGroups", async (ids, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().checklist.groups;
  dispatch(reorderGroups(ids));

  try {
    await apiClient.put("/checklist/reorder", { ids });
    return ids;
  } catch (error) {
    dispatch(setChecklistGroups(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to reorder groups"));
  }
});

export const addChecklistItem = createAsyncThunk<
  { groupId: string; tempId: string; title: string },
  { groupId: string; title: string },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/addItem", async ({ groupId, title }, { getState, dispatch, rejectWithValue }) => {
  const tempId = genId();
  const { groups } = getState().checklist;
  const group = groups.find((g) => g.id === groupId);
  const maxOrder = group ? group.items.reduce((max, i) => Math.max(max, i.order), -1) : -1;
  dispatch(addItem({ groupId, item: { id: tempId, title, checked: false, order: maxOrder + 1 } }));

  try {
    await apiClient.post(`/checklist/${groupId}/items`, { title, itemId: tempId });
    return { groupId, tempId, title };
  } catch (error) {
    dispatch(deleteItem({ groupId, itemId: tempId }));
    return rejectWithValue(getErrorMessage(error, "Failed to add item"));
  }
});

export const toggleChecklistItem = createAsyncThunk<
  { groupId: string; itemId: string; checked: boolean },
  { groupId: string; itemId: string },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/toggleItem", async ({ groupId, itemId }, { getState, dispatch, rejectWithValue }) => {
  const item = getState().checklist.groups
    .find((g) => g.id === groupId)
    ?.items.find((i) => i.id === itemId);
  const prevChecked = item?.checked;
  dispatch(toggleItem({ groupId, itemId }));

  try {
    const checked = !prevChecked;
    await apiClient.patch(`/checklist/${groupId}/items/${itemId}`, { checked });
    return { groupId, itemId, checked };
  } catch (error) {
    dispatch(toggleItem({ groupId, itemId }));
    return rejectWithValue(getErrorMessage(error, "Failed to toggle item"));
  }
});

export const editChecklistItem = createAsyncThunk<
  { groupId: string; itemId: string; title: string },
  { groupId: string; itemId: string; title: string },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/editItem", async ({ groupId, itemId, title }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().checklist.groups
    .find((g) => g.id === groupId)
    ?.items.find((i) => i.id === itemId)?.title;
  dispatch(editItem({ groupId, itemId, title }));

  try {
    await apiClient.patch(`/checklist/${groupId}/items/${itemId}`, { title });
    return { groupId, itemId, title };
  } catch (error) {
    if (prev !== undefined) {
      dispatch(editItem({ groupId, itemId, title: prev }));
    }
    return rejectWithValue(getErrorMessage(error, "Failed to edit item"));
  }
});

export const deleteChecklistItem = createAsyncThunk<
  { groupId: string; itemId: string },
  { groupId: string; itemId: string },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/deleteItem", async ({ groupId, itemId }, { getState, dispatch, rejectWithValue }) => {
  const group = getState().checklist.groups.find((g) => g.id === groupId);
  const prevItems = group ? [...group.items] : [];
  dispatch(deleteItem({ groupId, itemId }));

  try {
    await apiClient.delete(`/checklist/${groupId}/items/${itemId}`);
    return { groupId, itemId };
  } catch (error) {
    dispatch(restoreItems({ groupId, items: prevItems }));
    return rejectWithValue(getErrorMessage(error, "Failed to delete item"));
  }
});

export const reorderChecklistItems = createAsyncThunk<
  { groupId: string; itemIds: string[] },
  { groupId: string; itemIds: string[] },
  { state: { checklist: ChecklistState }; rejectValue: string }
>("checklist/reorderItems", async ({ groupId, itemIds }, { getState, dispatch, rejectWithValue }) => {
  const group = getState().checklist.groups.find((g) => g.id === groupId);
  const prevItems = group ? [...group.items] : [];
  dispatch(reorderItems({ groupId, itemIds }));

  try {
    await apiClient.put(`/checklist/${groupId}/items/reorder`, { itemIds });
    return { groupId, itemIds };
  } catch (error) {
    dispatch(restoreItems({ groupId, items: prevItems }));
    return rejectWithValue(getErrorMessage(error, "Failed to reorder items"));
  }
});

const checklistSlice = createSlice({
  name: "checklist",
  initialState,
  reducers: {
    setChecklistGroups: (state, action: PayloadAction<ChecklistGroup[]>) => {
      state.groups = action.payload;
    },
    addGroup: (state, action: PayloadAction<ChecklistGroup>) => {
      state.groups.push(action.payload);
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
    addItem: (state, action: PayloadAction<{ groupId: string; item: ChecklistItem }>) => {
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (group) {
        group.items.push(action.payload.item);
      }
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
    restoreItems: (
      state,
      action: PayloadAction<{ groupId: string; items: ChecklistItem[] }>,
    ) => {
      const group = state.groups.find((g) => g.id === action.payload.groupId);
      if (group) {
        group.items = action.payload.items;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChecklist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChecklist.fulfilled, (state, action) => {
        state.groups = action.payload;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchChecklist.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load checklist";
      });
  },
});

export const {
  setChecklistGroups,
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  addItem,
  toggleItem,
  editItem,
  deleteItem,
  reorderItems,
  restoreItems,
} = checklistSlice.actions;
export default checklistSlice.reducer;
