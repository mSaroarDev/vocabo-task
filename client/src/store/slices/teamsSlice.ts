import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Team {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface TeamsState {
  items: Team[];
  selectedTeamId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
}

const defaultTeams: Team[] = [
  { id: "1", name: "Vocabo", avatar: "V", color: "bg-white/20" },
  { id: "2", name: "Design Team", avatar: "D", color: "bg-white/15" },
  { id: "3", name: "Engineering", avatar: "E", color: "bg-white/15" },
];

const initialState: TeamsState = {
  items: defaultTeams,
  selectedTeamId: defaultTeams[0]?.id || null,
  isLoading: false,
  lastFetched: null,
};

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
    },
    addTeam: (state, action: PayloadAction<Team>) => {
      state.items.push(action.payload);
      state.selectedTeamId = action.payload.id;
    },
    removeTeam: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
      if (state.selectedTeamId === action.payload) {
        state.selectedTeamId = state.items[0]?.id || null;
      }
    },
    selectTeam: (state, action: PayloadAction<string>) => {
      state.selectedTeamId = action.payload;
    },
    setTeamsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearTeams: (state) => {
      state.items = [];
      state.selectedTeamId = null;
      state.lastFetched = null;
    },
  },
});

export const {
  setTeams,
  addTeam,
  removeTeam,
  selectTeam,
  setTeamsLoading,
  clearTeams,
} = teamsSlice.actions;
export default teamsSlice.reducer;