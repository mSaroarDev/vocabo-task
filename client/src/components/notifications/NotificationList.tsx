import { useEffect, useRef, useCallback } from "react";
import type { Notification } from "@/store/slices/notificationsSlice";
import NotificationItem from "./NotificationItem";
import NotificationSkeleton from "./NotificationSkeleton";
import NotificationEmptyState from "./NotificationEmptyState";

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export default function NotificationList({
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onMarkRead,
  onClick,
}: NotificationListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "200px",
    });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersection]);

  if (isLoading) {
    return <NotificationSkeleton />;
  }

  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <div className="divide-y divide-border/50">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkRead={onMarkRead}
          onClick={onClick}
        />
      ))}
      {isLoadingMore && (
        <div className="px-4 py-3">
          <div className="flex animate-pulse items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-accent" />
            <div className="h-3 flex-1 rounded bg-accent" />
          </div>
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
