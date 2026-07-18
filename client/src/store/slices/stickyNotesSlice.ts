import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface StickyNote {
  id: string;
  groupId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface StickyNoteGroup {
  id: string;
  name: string;
  order: number;
}

interface StickyNotesState {
  groups: StickyNoteGroup[];
  notes: StickyNote[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: StickyNotesState = {
  groups: [],
  notes: [],
  isLoading: false,
  lastFetched: null,
  error: null,
};

function mapGroup(doc: any): StickyNoteGroup {
  return {
    id: doc._id,
    name: doc.name,
    order: doc.order,
  };
}

function mapNote(doc: any): StickyNote {
  return {
    id: doc._id,
    groupId: doc.groupId,
    title: doc.title || "",
    content: doc.content || "",
    color: doc.color || "#ffffff",
    isPinned: doc.isPinned || false,
    order: doc.order ?? 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
  };
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

// ─── Fetch all data ───────────────────────────────────────

export const fetchStickyNotes = createAsyncThunk<
  { groups: StickyNoteGroup[]; notes: StickyNote[] },
  void,
  { rejectValue: string }
>("stickyNotes/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const [groupsRes, notesRes] = await Promise.all([
      apiClient.get("/sticky-notes/groups"),
      apiClient.get("/sticky-notes/notes"),
    ]);
    return {
      groups: (Array.isArray(groupsRes.data.data) ? groupsRes.data.data : []).map(mapGroup),
      notes: (Array.isArray(notesRes.data.data) ? notesRes.data.data : []).map(mapNote),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load sticky notes"));
  }
});

// ─── Group thunks ─────────────────────────────────────────

export const createStickyGroup = createAsyncThunk<
  StickyNoteGroup,
  string,
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/createGroup", async (name, { getState, dispatch, rejectWithValue }) => {
  const id = crypto.randomUUID();
  const { groups } = getState().stickyNotes;
  const maxOrder = groups.reduce((max, g) => Math.max(max, g.order), -1);
  dispatch(addGroup({ id, name, order: maxOrder + 1 }));

  try {
    await apiClient.post("/sticky-notes/groups", { name: name.trim(), id });
    return { id, name: name.trim(), order: maxOrder + 1 };
  } catch (error) {
    dispatch(deleteGroup(id));
    return rejectWithValue(getErrorMessage(error, "Failed to create group"));
  }
});

export const renameStickyGroup = createAsyncThunk<
  { id: string; name: string },
  { id: string; name: string },
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/renameGroup", async ({ id, name }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.groups.find((g) => g.id === id)?.name;
  dispatch(renameGroup({ id, name }));

  try {
    await apiClient.patch(`/sticky-notes/groups/${id}`, { name: name.trim() });
    return { id, name: name.trim() };
  } catch (error) {
    if (prev !== undefined) dispatch(renameGroup({ id, name: prev }));
    return rejectWithValue(getErrorMessage(error, "Failed to rename group"));
  }
});

export const deleteStickyGroup = createAsyncThunk<
  string,
  string,
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/deleteGroup", async (id, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.groups;
  dispatch(deleteGroup(id));

  try {
    await apiClient.delete(`/sticky-notes/groups/${id}`);
    return id;
  } catch (error) {
    dispatch(setGroups(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to delete group"));
  }
});

export const reorderStickyGroups = createAsyncThunk<
  string[],
  string[],
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/reorderGroups", async (ids, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.groups;
  dispatch(reorderGroups(ids));

  try {
    await apiClient.put("/sticky-notes/groups/reorder", { ids });
    return ids;
  } catch (error) {
    dispatch(setGroups(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to reorder groups"));
  }
});

// ─── Note thunks ──────────────────────────────────────────

export const createStickyNote = createAsyncThunk<
  StickyNote,
  { id: string; groupId: string; title: string; content: string; color: string },
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/createNote", async (payload, { getState, dispatch, rejectWithValue }) => {
  const { notes } = getState().stickyNotes;
  const groupNotes = notes.filter((n) => n.groupId === payload.groupId);
  const maxOrder = groupNotes.reduce((max, n) => Math.max(max, n.order || 0), -1);

  const now = Date.now();
  const note: StickyNote = {
    id: payload.id,
    groupId: payload.groupId,
    title: payload.title,
    content: payload.content,
    color: payload.color,
    isPinned: false,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  dispatch(addNote(note));

  try {
    await apiClient.post("/sticky-notes/notes", {
      groupId: payload.groupId,
      title: payload.title,
      content: payload.content,
      color: payload.color,
      id: payload.id,
    });
    return note;
  } catch (error) {
    dispatch(deleteNote(payload.id));
    return rejectWithValue(getErrorMessage(error, "Failed to create note"));
  }
});

export const updateStickyNote = createAsyncThunk<
  { id: string; changes: Partial<StickyNote> },
  { id: string; changes: Partial<StickyNote> },
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/updateNote", async ({ id, changes }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.notes.find((n) => n.id === id);
  if (!prev) return rejectWithValue("Note not found");

  dispatch(updateNote({ id, changes }));

  try {
    const body: Record<string, unknown> = {};
    if (changes.title !== undefined) body.title = changes.title;
    if (changes.content !== undefined) body.content = changes.content;
    if (changes.color !== undefined) body.color = changes.color;
    if (changes.isPinned !== undefined) body.isPinned = changes.isPinned;

    await apiClient.patch(`/sticky-notes/notes/${id}`, body);
    return { id, changes };
  } catch (error) {
    dispatch(updateNote({ id, changes: prev }));
    return rejectWithValue(getErrorMessage(error, "Failed to update note"));
  }
});

export const deleteStickyNote = createAsyncThunk<
  string,
  string,
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/deleteNote", async (id, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.notes;
  dispatch(deleteNote(id));

  try {
    await apiClient.delete(`/sticky-notes/notes/${id}`);
    return id;
  } catch (error) {
    dispatch(setNotes(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to delete note"));
  }
});

export const reorderStickyNotes = createAsyncThunk<
  { groupId: string; noteIds: string[] },
  { groupId: string; noteIds: string[] },
  { state: { stickyNotes: StickyNotesState }; rejectValue: string }
>("stickyNotes/reorderNotes", async ({ groupId, noteIds }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().stickyNotes.notes;
  dispatch(reorderNotes({ groupId, noteIds }));

  try {
    await apiClient.put("/sticky-notes/notes/reorder", { groupId, noteIds });
    return { groupId, noteIds };
  } catch (error) {
    dispatch(setNotes(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to reorder notes"));
  }
});

// ─── Slice ────────────────────────────────────────────────

const stickyNotesSlice = createSlice({
  name: "stickyNotes",
  initialState,
  reducers: {
    // Groups
    addGroup: (state, action: PayloadAction<StickyNoteGroup>) => {
      state.groups.push(action.payload);
    },
    renameGroup: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const group = state.groups.find((g) => g.id === action.payload.id);
      if (group) group.name = action.payload.name.trim();
    },
    deleteGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((g) => g.id !== action.payload);
      state.notes = state.notes.filter((n) => n.groupId !== action.payload);
    },
    reorderGroups: (state, action: PayloadAction<string[]>) => {
      const groupMap = new Map(state.groups.map((g) => [g.id, g]));
      state.groups = action.payload
        .map((id, index) => {
          const group = groupMap.get(id);
          return group ? { ...group, order: index } : null;
        })
        .filter((g): g is StickyNoteGroup => g !== null);
    },
    setGroups: (state, action: PayloadAction<StickyNoteGroup[]>) => {
      state.groups = action.payload;
    },

    // Notes
    addNote: (state, action: PayloadAction<StickyNote>) => {
      state.notes.push(action.payload);
    },
    updateNote: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<StickyNote> }>
    ) => {
      const note = state.notes.find((n) => n.id === action.payload.id);
      if (note) Object.assign(note, action.payload.changes, { updatedAt: Date.now() });
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter((n) => n.id !== action.payload);
    },
    reorderNotes: (state, action: PayloadAction<{ groupId: string; noteIds: string[] }>) => {
      const groupNotes = state.notes.filter((n) => n.groupId === action.payload.groupId);
      const noteMap = new Map(groupNotes.map((n) => [n.id, n]));
      const reordered = action.payload.noteIds
        .map((id) => noteMap.get(id))
        .filter((n): n is StickyNote => n !== undefined);
      const otherNotes = state.notes.filter((n) => n.groupId !== action.payload.groupId);
      state.notes = [...otherNotes, ...reordered];
    },
    setNotes: (state, action: PayloadAction<StickyNote[]>) => {
      state.notes = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStickyNotes
      .addCase(fetchStickyNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStickyNotes.fulfilled, (state, action) => {
        state.groups = action.payload.groups;
        state.notes = action.payload.notes;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchStickyNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load sticky notes";
      });
  },
});

export const {
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  setGroups,
  addNote,
  updateNote,
  deleteNote,
  reorderNotes,
  setNotes,
} = stickyNotesSlice.actions;

export const NOTE_COLORS = [
  "#ffffff",
  "#f28b82",
  "#fbbc04",
  "#fff475",
  "#ccff90",
  "#a7ffeb",
  "#cbf0f8",
  "#aecbfa",
  "#d7aefb",
  "#fdcfe8",
  "#e6c9a8",
  "#e8eaed",
];

export default stickyNotesSlice.reducer;
