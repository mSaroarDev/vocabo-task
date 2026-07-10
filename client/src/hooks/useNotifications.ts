import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead as markAllAsReadAction,
  markAsRead as markAsReadAction,
  addNotification,
  resetNotifications,
  setSheetOpen,
  toggleSheet,
  type Notification,
} from "@/store/slices/notificationsSlice";
import { useSocket } from "./useSocket";
import { useTeams } from "./useTeams";

export function useNotifications() {
  const dispatch = useAppDispatch();
  const socketRef = useSocket();
  const { selectedTeam } = useTeams();
  const {
    items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    page,
    limit,
    error,
    isSheetOpen,
  } = useAppSelector((state) => state.notifications);

  const listenerAttachedRef = useRef(false);

  const activeWorkspaceId =
    useAppSelector((state) => state.workspaces.currentTeamId) ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("workspace")
      : null);

  const workspaceId =
    (typeof activeWorkspaceId === "string" ? activeWorkspaceId : null) ||
    selectedTeam?.id ||
    null;

  const loadNotifications = useCallback(
    (pageNum = 1) => {
      if (!workspaceId) return;
      dispatch(
        fetchNotifications({
          workspaceId,
          page: pageNum,
          limit,
        })
      );
    },
    [dispatch, workspaceId, limit]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    loadNotifications(page + 1);
  }, [hasMore, isLoadingMore, isLoading, loadNotifications, page]);

  const refetch = useCallback(() => {
    dispatch(resetNotifications());
    loadNotifications(1);
  }, [dispatch, loadNotifications]);

  const getUnreadCount = useCallback(() => {
    if (workspaceId) {
      dispatch(fetchUnreadCount(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const markAllRead = useCallback(() => {
    if (workspaceId) {
      dispatch(markAllAsReadAction(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const markRead = useCallback(
    (notificationId: string) => {
      dispatch(markAsReadAction(notificationId));
    },
    [dispatch]
  );

  const openSheet = useCallback(() => {
    dispatch(setSheetOpen(true));
    if (workspaceId) {
      dispatch(fetchUnreadCount(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const closeSheet = useCallback(() => {
    dispatch(setSheetOpen(false));
  }, [dispatch]);

  const toggleNotificationSheet = useCallback(() => {
    dispatch(toggleSheet());
  }, [dispatch]);

  useEffect(() => {
    if (workspaceId) {
      refetch();
      getUnreadCount();
    } else {
      dispatch(resetNotifications());
    }
  }, [workspaceId, refetch, getUnreadCount, dispatch]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || listenerAttachedRef.current) return;

    socket.on("notification:new", (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    socket.on("notification:unread-count", () => {
      if (workspaceId) {
        dispatch(fetchUnreadCount(workspaceId));
      }
    });

    listenerAttachedRef.current = true;

    return () => {
      socket.off("notification:new");
      socket.off("notification:unread-count");
      listenerAttachedRef.current = false;
    };
  }, [socketRef.current, dispatch, workspaceId]);

  return {
    notifications: items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    isSheetOpen,
    loadNotifications,
    loadMore,
    refetch,
    getUnreadCount,
    markAllRead,
    markRead,
    openSheet,
    closeSheet,
    toggleNotificationSheet,
  };
}
