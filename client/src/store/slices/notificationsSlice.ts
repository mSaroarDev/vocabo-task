import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export type NotificationType = "task" | "comment" | "mention" | "system";

export interface NotificationDoc {
  _id: string;
  title: string;
  body: string;
  type: NotificationType;
  recipientIds: string[];
  seenBy: string[];
  createdBy?: string;
  teamId?: string;
  workspaceId?: string;
  taskId?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationsState {
  items: NotificationDoc[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  isLoading: false,
  lastFetched: null,
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

const fetchNotifications = createAsyncThunk<
  NotificationDoc[],
  void,
  { state: { notifications: NotificationsState }; rejectValue: string }
>("notifications/fetchNotifications", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/notifications");
    const data = response.data.data;
    return (Array.isArray(data) ? data : []) as NotificationDoc[];
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load notifications"));
  }
});

const markNotificationRead = createAsyncThunk<
  string,
  string,
  { state: { notifications: NotificationsState; auth: { user: { _id: string } | null } }; rejectValue: string }
>("notifications/markRead", async (id, { getState, dispatch, rejectWithValue }) => {
  const userId = getState().auth.user?._id;
  if (!userId) return rejectWithValue("Not authenticated");

  dispatch(markReadLocal({ id, userId }));

  try {
    await apiClient.patch(`/notifications/${id}/read`);
    return id;
  } catch (error) {
    dispatch(unmarkReadLocal({ id, userId }));
    return rejectWithValue(getErrorMessage(error, "Failed to mark as read"));
  }
});

const markAllNotificationsRead = createAsyncThunk<
  void,
  void,
  { state: { notifications: NotificationsState; auth: { user: { _id: string } | null } }; rejectValue: string }
>("notifications/markAllRead", async (_, { getState, dispatch, rejectWithValue }) => {
  const userId = getState().auth.user?._id;
  if (!userId) return rejectWithValue("Not authenticated");

  const prev = getState().notifications.items;
  dispatch(markAllReadLocal(userId));

  try {
    await apiClient.patch("/notifications/read-all");
  } catch (error) {
    dispatch(setNotifications(prev));
    return rejectWithValue(getErrorMessage(error, "Failed to mark all as read"));
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationDoc[]>) => {
      state.items = action.payload;
    },
    prependNotification: (state, action: PayloadAction<NotificationDoc>) => {
      state.items = [action.payload, ...state.items];
    },
    markReadLocal: (state, action: PayloadAction<{ id: string; userId: string }>) => {
      const item = state.items.find((n) => n._id === action.payload.id);
      if (item && !item.seenBy.includes(action.payload.userId)) {
        item.seenBy.push(action.payload.userId);
      }
    },
    unmarkReadLocal: (state, action: PayloadAction<{ id: string; userId: string }>) => {
      const item = state.items.find((n) => n._id === action.payload.id);
      if (item) {
        item.seenBy = item.seenBy.filter((id) => id !== action.payload.userId);
      }
    },
    markAllReadLocal: (state, action: PayloadAction<string>) => {
      for (const item of state.items) {
        if (!item.seenBy.includes(action.payload)) {
          item.seenBy.push(action.payload);
        }
      }
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.lastFetched = Date.now();
        state.error = action.payload || "Failed to load notifications";
      });
  },
});

export const {
  setNotifications,
  prependNotification,
  markReadLocal,
  unmarkReadLocal,
  markAllReadLocal,
  resetNotifications,
} = notificationsSlice.actions;

export { fetchNotifications, markNotificationRead, markAllNotificationsRead };
export default notificationsSlice.reducer;

export const selectNotificationItems = (state: {
  notifications: NotificationsState;
}) => state.notifications.items;

export const selectUnreadCount = (state: {
  notifications: NotificationsState;
  auth: { user: { _id: string } | null };
}) => {
  const userId = state.auth.user?._id;
  if (!userId) return 0;
  return state.notifications.items.filter((n) => !n.seenBy.includes(userId)).length;
};
