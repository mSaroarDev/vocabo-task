import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface Team {
  id: string;
  name: string;
  avatar: string;
  color: string;
  inviteCode?: string;
}

interface TeamsState {
  items: Team[];
  selectedTeamId: string | null;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: TeamsState = {
  items: [],
  selectedTeamId: null,
  isLoading: false,
  lastFetched: null,
  error: null,
};

interface ApiTeam {
  _id: string;
  name: string;
  inviteCode: string;
}

const teamColors = [
  "bg-blue-500/20",
  "bg-purple-500/20",
  "bg-pink-500/20",
  "bg-green-500/20",
  "bg-amber-500/20",
  "bg-cyan-500/20",
];

const mapTeam = (team: ApiTeam, index = 0): Team => ({
  id: team._id,
  name: team.name,
  avatar: team.name.charAt(0).toUpperCase(),
  color: teamColors[index % teamColors.length],
  inviteCode: team.inviteCode,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export const fetchTeams = createAsyncThunk<Team[], void, { rejectValue: string }>(
  "teams/fetchTeams",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/teams");
      return (response.data.data as ApiTeam[]).map(mapTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load teams"));
    }
  }
);

export const createTeam = createAsyncThunk<Team, { name: string }, { rejectValue: string }>(
  "teams/createTeam",
  async ({ name }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/teams", { name });
      return mapTeam(response.data.data as ApiTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create team"));
    }
  }
);

export const joinTeam = createAsyncThunk<Team, { inviteCode: string }, { rejectValue: string }>(
  "teams/joinTeam",
  async ({ inviteCode }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/teams/join", { inviteCode });
      return mapTeam(response.data.data as ApiTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to join team"));
    }
  }
);

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    addTeam: (state, action: PayloadAction<Team>) => {
      const existingTeam = state.items.find((team) => team.id === action.payload.id);
      if (!existingTeam) {
        state.items.push(action.payload);
      }
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
    clearTeamsError: (state) => {
      state.error = null;
    },
    clearTeams: (state) => {
      state.items = [];
      state.selectedTeamId = null;
      state.lastFetched = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.items = action.payload;
        state.selectedTeamId = action.payload.some((team) => team.id === state.selectedTeamId)
          ? state.selectedTeamId
          : action.payload[0]?.id || null;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load teams";
      })
      .addCase(createTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        const existingTeam = state.items.find((team) => team.id === action.payload.id);
        if (!existingTeam) {
          state.items.unshift(action.payload);
        }
        state.selectedTeamId = action.payload.id;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to create team";
      })
      .addCase(joinTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinTeam.fulfilled, (state, action) => {
        const existingTeam = state.items.find((team) => team.id === action.payload.id);
        if (!existingTeam) {
          state.items.unshift(action.payload);
        }
        state.selectedTeamId = action.payload.id;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(joinTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to join team";
      });
  },
});

export const {
  setTeams,
  addTeam,
  removeTeam,
  selectTeam,
  setTeamsLoading,
  clearTeamsError,
  clearTeams,
} = teamsSlice.actions;
export default teamsSlice.reducer;
