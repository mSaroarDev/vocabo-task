import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";

export interface Notification {
  _id: string;
  workspaceId: string;
  teamId: string;
  actorId: { _id: string; name: string; email: string; avatar?: string } | string;
  actorName: string;
  actorAvatar?: string;
  type: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  isSystem: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupedNotification {
  _id: { actorId: string; type: string };
  actorName: string;
  actorAvatar?: string;
  count: number;
  latestTimestamp: string;
  entityType: string;
  sampleTitle: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface FetchNotificationsResponse {
  data: Notification[];
  pagination: PaginationInfo;
}

interface NotificationsState {
  items: Notification[];
  groupedItems: GroupedNotification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  limit: number;
  error: string | null;
  isSheetOpen: boolean;
  useGroupedView: boolean;
}

const initialState: NotificationsState = {
  items: [],
  groupedItems: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  page: 1,
  limit: 20,
  error: null,
  isSheetOpen: false,
  useGroupedView: false,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export const fetchNotifications = createAsyncThunk<
  FetchNotificationsResponse,
  { workspaceId: string; page?: number; limit?: number; type?: string; grouped?: boolean },
  { rejectValue: string }
>("notifications/fetchNotifications", async (params, { rejectWithValue }) => {
  try {
    const { workspaceId, page = 1, limit = 20, type, grouped } = params;
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(page));
    queryParams.set("limit", String(limit));
    if (type) queryParams.set("type", type);
    if (grouped) queryParams.set("grouped", "true");

    const response = await apiClient.get(
      `/workspaces/${workspaceId}/notifications?${queryParams.toString()}`
    );
    return response.data.data as FetchNotificationsResponse;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load notifications"));
  }
});

export const fetchUnreadCount = createAsyncThunk<
  number,
  string,
  { rejectValue: string }
>("notifications/fetchUnreadCount", async (workspaceId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/notifications/unread-count?workspaceId=${workspaceId}`);
    return (response.data.data as { count: number }).count;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load unread count"));
  }
});

export const markAllAsRead = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("notifications/markAllAsRead", async (workspaceId, { rejectWithValue }) => {
  try {
    await apiClient.post("/notifications/read-all", { workspaceId });
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to mark all as read"));
  }
});

export const markAsRead = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("notifications/markAsRead", async (notificationId, { rejectWithValue }) => {
  try {
    await apiClient.post(`/notifications/${notificationId}/read`);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to mark as read"));
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isSheetOpen = action.payload;
    },
    toggleSheet: (state) => {
      state.isSheetOpen = !state.isSheetOpen;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const exists = state.items.some((n) => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    resetNotifications: (state) => {
      state.items = [];
      state.groupedItems = [];
      state.page = 1;
      state.hasMore = true;
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = null;
      state.unreadCount = 0;
    },
    setUseGroupedView: (state, action: PayloadAction<boolean>) => {
      state.useGroupedView = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        if (action.meta.arg.page && action.meta.arg.page > 1) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;
        const { page } = action.meta.arg;

        if (page && page > 1) {
          const existingIds = new Set(state.items.map((n) => n._id));
          const newItems = data.filter((n) => !existingIds.has(n._id));
          state.items.push(...newItems);
        } else {
          state.items = data;
        }

        state.hasMore = pagination.hasMore;
        state.page = pagination.page;
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload || "Failed to load notifications";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.items = state.items.map((n) => ({
          ...n,
          readBy: [...(n.readBy || [])],
        }));
      })
      .addCase(markAsRead.fulfilled, (state) => {
        if (state.unreadCount > 0) state.unreadCount -= 1;
      });
  },
});

export const {
  setSheetOpen,
  toggleSheet,
  addNotification,
  setUnreadCount,
  decrementUnreadCount,
  resetNotifications,
  setUseGroupedView,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
