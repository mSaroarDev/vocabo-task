import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/api/client";
import type { Person } from "@/components/table/types";

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: Person;
  createdAt: string;
  isPending?: boolean;
}

interface CommentsState {
  byTask: Record<string, Comment[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  byTask: {},
  isLoading: false,
  error: null,
};

const genId = () => `temp_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

function mapComment(doc: any, taskId: string): Comment {
  const author = doc.author || {};
  return {
    id: doc._id,
    taskId,
    content: doc.content,
    author: {
      name: author.name || "Unknown",
      initials: author.name ? getInitials(author.name) : "?",
      color: "#525252",
      avatar: author.avatar || undefined,
    },
    createdAt: doc.createdAt,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface TaskContext {
  teamId: string;
  workspaceId: string;
  taskId: string;
}

export const fetchComments = createAsyncThunk<
  { taskId: string; comments: Comment[] },
  TaskContext,
  { rejectValue: string }
>("comments/fetchComments", async ({ teamId, workspaceId, taskId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}/comments`
    );
    const data = response.data.data;
    const comments = (Array.isArray(data) ? data : []).map((doc: any) => mapComment(doc, taskId));
    return { taskId, comments };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load comments"));
  }
});

export const addComment = createAsyncThunk<
  { taskId: string; tempId: string; comment: Comment },
  TaskContext & { content: string; author: Person },
  { state: { comments: CommentsState; auth: { user: { name: string; _id: string; avatar?: string } | null } }; rejectValue: string }
>("comments/addComment", async ({ teamId, workspaceId, taskId, content, author }, { dispatch, rejectWithValue }) => {
  const tempId = genId();
  const optimistic: Comment = {
    id: tempId,
    taskId,
    content,
    author,
    createdAt: new Date().toISOString(),
    isPending: true,
  };
  dispatch(addOptimisticComment({ taskId, comment: optimistic }));

  try {
    const response = await apiClient.post(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}/comments`,
      { content }
    );
    const comment = mapComment(response.data.data, taskId);
    dispatch(confirmComment({ taskId, tempId, comment }));
    return { taskId, tempId, comment };
  } catch (error) {
    dispatch(removeComment({ taskId, commentId: tempId }));
    return rejectWithValue(getErrorMessage(error, "Failed to post comment"));
  }
});

export const deleteComment = createAsyncThunk<
  { taskId: string; commentId: string },
  TaskContext & { commentId: string },
  { state: { comments: CommentsState }; rejectValue: string }
>("comments/deleteComment", async ({ teamId, workspaceId, taskId, commentId }, { getState, dispatch, rejectWithValue }) => {
  const prev = getState().comments.byTask[taskId] || [];
  dispatch(removeComment({ taskId, commentId }));

  try {
    await apiClient.delete(
      `/teams/${teamId}/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`
    );
    return { taskId, commentId };
  } catch (error) {
    dispatch(setComments({ taskId, comments: prev }));
    return rejectWithValue(getErrorMessage(error, "Failed to delete comment"));
  }
});

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    addOptimisticComment: (state, action: PayloadAction<{ taskId: string; comment: Comment }>) => {
      const { taskId, comment } = action.payload;
      if (!state.byTask[taskId]) state.byTask[taskId] = [];
      state.byTask[taskId].push(comment);
    },
    confirmComment: (
      state,
      action: PayloadAction<{ taskId: string; tempId: string; comment: Comment }>
    ) => {
      const { taskId, tempId, comment } = action.payload;
      const list = state.byTask[taskId];
      if (!list) return;
      const idx = list.findIndex((c) => c.id === tempId);
      if (idx !== -1) list[idx] = comment;
    },
    removeComment: (state, action: PayloadAction<{ taskId: string; commentId: string }>) => {
      const { taskId, commentId } = action.payload;
      const list = state.byTask[taskId];
      if (!list) return;
      state.byTask[taskId] = list.filter((c) => c.id !== commentId);
    },
    setComments: (state, action: PayloadAction<{ taskId: string; comments: Comment[] }>) => {
      state.byTask[action.payload.taskId] = action.payload.comments;
    },
    clearComments: (state, action: PayloadAction<string>) => {
      delete state.byTask[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.byTask[action.payload.taskId] = action.payload.comments;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load comments";
      });
  },
});

export const {
  addOptimisticComment,
  confirmComment,
  removeComment,
  setComments,
  clearComments,
} = commentsSlice.actions;
export default commentsSlice.reducer;
