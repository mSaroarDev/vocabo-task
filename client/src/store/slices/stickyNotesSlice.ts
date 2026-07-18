import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StickyNote {
  id: string;
  groupId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
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
}

const initialState: StickyNotesState = {
  groups: [],
  notes: [],
};

const genId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const NOTE_COLORS = [
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

const stickyNotesSlice = createSlice({
  name: "stickyNotes",
  initialState,
  reducers: {
    // --- Groups ---
    addGroup: {
      reducer: (state, action: PayloadAction<StickyNoteGroup>) => {
        state.groups.push(action.payload);
      },
      prepare: (name: string) => {
        const clean = name.trim();
        return {
          payload: {
            id: genId(),
            name: clean,
            order: 0,
          },
        };
      },
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

    // --- Notes ---
    addNote: (state, action: PayloadAction<StickyNote>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<{ id: string; title: string; content: string }>) => {
      const note = state.notes.find((n) => n.id === action.payload.id);
      if (note) {
        note.title = action.payload.title.trim();
        note.content = action.payload.content.trim();
        note.updatedAt = Date.now();
      }
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter((n) => n.id !== action.payload);
    },
    pinNote: (state, action: PayloadAction<string>) => {
      const note = state.notes.find((n) => n.id === action.payload);
      if (note) {
        note.isPinned = !note.isPinned;
        note.updatedAt = Date.now();
      }
    },
    setNoteColor: (state, action: PayloadAction<{ id: string; color: string }>) => {
      const note = state.notes.find((n) => n.id === action.payload.id);
      if (note) {
        note.color = action.payload.color;
        note.updatedAt = Date.now();
      }
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
  },
});

export const {
  addGroup,
  renameGroup,
  deleteGroup,
  reorderGroups,
  addNote,
  updateNote,
  deleteNote,
  pinNote,
  setNoteColor,
  reorderNotes,
} = stickyNotesSlice.actions;

export { NOTE_COLORS, genId };
export default stickyNotesSlice.reducer;
