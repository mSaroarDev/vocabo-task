import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/store/slices/notificationsSlice";
import NotificationHeader from "./NotificationHeader";
import NotificationList from "./NotificationList";

interface NotificationSheetProps {
  isOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  onMarkAllRead: () => void;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export default function NotificationSheet({
  isOpen,
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  onClose,
  onLoadMore,
  onMarkAllRead,
  onMarkRead,
  onClick,
}: NotificationSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-background shadow-xl transition-transform duration-300 ease-in-out",
          "w-full sm:w-[400px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <NotificationHeader onClose={onClose} onMarkAllRead={onMarkAllRead} />
        <div className="flex-1 overflow-y-auto">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            onMarkRead={onMarkRead}
            onClick={onClick}
          />
        </div>
      </div>
    </>
  );
}
