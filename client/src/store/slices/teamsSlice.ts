import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  joinedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  avatar: string;
  color: string;
  inviteCode?: string;
  owner?: string;
  members?: TeamMember[];
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

interface ApiTeamMember {
  user: { _id: string; name: string; email: string; avatar?: string } | string;
  role: string;
  joinedAt?: string;
}

interface ApiTeam {
  _id: string;
  name: string;
  inviteCode: string;
  owner: string;
  members: ApiTeamMember[];
  avatar?: string;
}

const mapMember = (m: ApiTeamMember): TeamMember => {
  if (typeof m.user === "object" && m.user !== null) {
    return {
      userId: m.user._id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      joinedAt: m.joinedAt,
    };
  }
  return {
    userId: m.user as string,
    name: "",
    email: "",
    role: m.role,
    joinedAt: m.joinedAt,
  };
};

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
  avatar: team.avatar || team.name.charAt(0).toUpperCase(),
  color: teamColors[index % teamColors.length],
  inviteCode: team.inviteCode,
  owner: team.owner,
  members: (team.members || []).map(mapMember),
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

let fetchTeamsRequest: Promise<Team[]> | null = null;

export const fetchTeams = createAsyncThunk<Team[], void, { rejectValue: string }>(
  "teams/fetchTeams",
  async (_, { rejectWithValue }) => {
    if (fetchTeamsRequest) return fetchTeamsRequest;

    fetchTeamsRequest = (async () => {
      try {
        const response = await apiClient.get("/teams");
        return (response.data.data as ApiTeam[]).map(mapTeam);
      } catch (error) {
        throw rejectWithValue(getErrorMessage(error, "Failed to load teams"));
      } finally {
        fetchTeamsRequest = null;
      }
    })();

    return fetchTeamsRequest;
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

export const addTeamMember = createAsyncThunk<Team, { teamId: string; email: string }, { rejectValue: string }>(
  "teams/addTeamMember",
  async ({ teamId, email }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/teams/${teamId}/members`, { email });
      return mapTeam(response.data.data as ApiTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to add member"));
    }
  }
);

export const removeTeamMember = createAsyncThunk<Team, { teamId: string; memberUserId: string }, { rejectValue: string }>(
  "teams/removeTeamMember",
  async ({ teamId, memberUserId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/teams/${teamId}/members/${memberUserId}`);
      return mapTeam(response.data.data as ApiTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to remove member"));
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

export const deleteTeam = createAsyncThunk<string, string, { rejectValue: string }>(
  "teams/deleteTeam",
  async (teamId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/teams/${teamId}`);
      return teamId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete team"));
    }
  }
);

export const leaveTeam = createAsyncThunk<Team, string, { rejectValue: string }>(
  "teams/leaveTeam",
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/teams/${teamId}/leave`);
      return mapTeam(response.data.data as ApiTeam);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to leave team"));
    }
  }
);

export const uploadTeamAvatar = createAsyncThunk<ApiTeam, { teamId: string; file: File }, { rejectValue: string }>(
  "teams/uploadTeamAvatar",
  async ({ teamId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await apiClient.post(`/teams/${teamId}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data as ApiTeam;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to upload avatar"));
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
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(addTeamMember.rejected, (state, action) => {
        state.error = action.payload || "Failed to add member";
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(removeTeamMember.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove member";
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        if (state.selectedTeamId === action.payload) {
          state.selectedTeamId = state.items[0]?.id || null;
        }
        state.error = null;
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete team";
      })
      .addCase(leaveTeam.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload.id);
        if (state.selectedTeamId === action.payload.id) {
          state.selectedTeamId = state.items[0]?.id || null;
        }
        state.error = null;
      })
      .addCase(leaveTeam.rejected, (state, action) => {
        state.error = action.payload || "Failed to leave team";
      })
      .addCase(uploadTeamAvatar.pending, (state, action) => {
        const { teamId, file } = action.meta.arg;
        const team = state.items.find((t) => t.id === teamId);
        if (team && file) {
          team.avatar = URL.createObjectURL(file);
        }
      })
      .addCase(uploadTeamAvatar.fulfilled, (state, action) => {
        const apiTeam = action.payload;
        const index = state.items.findIndex((t) => t.id === apiTeam._id);
        if (index !== -1) {
          const color = state.items[index].color;
          state.items[index] = mapTeam(apiTeam, index);
          state.items[index].color = color;
        }
        state.error = null;
      })
      .addCase(uploadTeamAvatar.rejected, (state, action) => {
        const { teamId } = action.meta.arg;
        const team = state.items.find((t) => t.id === teamId);
        if (team) {
          team.avatar = team.name.charAt(0).toUpperCase();
        }
        state.error = action.payload || "Failed to upload avatar";
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
