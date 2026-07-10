import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Sidebar from "./sidebar";
import { NotificationBell, NotificationSheet } from "@/components/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface NotionLayoutProps {
  children: ReactNode;
}

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 420;
const DEFAULT_SIDEBAR_WIDTH = 320;

export default function NotionLayout({ children }: NotionLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isSheetOpen,
    loadMore,
    markAllRead,
    markRead,
    openSheet,
    closeSheet,
  } = useNotifications();

  const { selectedTeam } = useTeams();
  const [searchParams] = useSearchParams();
  const activeWorkspaceId = searchParams.get("workspace");

  const { workspaces } = useWorkspaces(selectedTeam?.id);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragStartRef.current = { x: event.clientX, width: sidebarWidth };
      setIsResizing(true);
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const nextWidth = start.width + (event.clientX - start.x);
      const clamped = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, nextWidth));
      setSidebarWidth(clamped);
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className="relative h-full shrink-0"
        style={{ width: sidebarWidth }}
      >
        <Sidebar />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={handlePointerDown}
          className={`group absolute right-0 top-0 z-40 h-full w-1 cursor-col-resize transition-colors hover:bg-sidebar-border ${
            isResizing ? "bg-sidebar-border" : ""
          }`}
        >
          <span className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-sidebar-border opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-10 items-center justify-between bg-background px-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            {selectedTeam && (
              <>
                <span className="truncate font-medium text-foreground">{selectedTeam.name}</span>
                {activeWorkspace && (
                  <>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="truncate">{activeWorkspace.name}</span>
                  </>
                )}
              </>
            )}
          </div>
          <NotificationBell unreadCount={unreadCount} onClick={openSheet} />
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
      <NotificationSheet
        isOpen={isSheetOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onClose={closeSheet}
        onLoadMore={loadMore}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
      />
    </div>
  );
}
