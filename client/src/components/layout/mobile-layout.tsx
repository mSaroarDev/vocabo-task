import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import MobileNav from "./mobile-nav";
import NotificationBell from "@/components/notifications/notification-bell";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useSocket } from "@/hooks/useSocket";
import { useAppDispatch } from "@/store/hooks";
import type { Workspace } from "@/store/slices/workspacesSlice";
import { fetchChecklist } from "@/store/slices/checklistSlice";
import { fetchNotifications } from "@/store/slices/notificationsSlice";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  useSocket();

  const dispatch = useAppDispatch();
  const checklistFetched = useRef(false);
  useEffect(() => {
    if (checklistFetched.current) return;
    checklistFetched.current = true;
    dispatch(fetchChecklist());
  }, [dispatch]);

  const notificationsFetched = useRef(false);
  useEffect(() => {
    if (notificationsFetched.current) return;
    notificationsFetched.current = true;
    dispatch(fetchNotifications());
  }, [dispatch]);

  const { selectedTeam } = useTeams();
  const [searchParams] = useSearchParams();
  const activeWorkspaceId = searchParams.get("workspace");

  const { workspaces } = useWorkspaces(selectedTeam?.id);
  const activeWorkspace = workspaces.find(
    (w: Workspace) => w.id === activeWorkspaceId
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center justify-between bg-background px-4">
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {selectedTeam && (
            <>
              <span className="truncate font-medium text-foreground">
                {selectedTeam.name}
              </span>
              {activeWorkspace && (
                <>
                  <ChevronRight size={14} className="shrink-0" />
                  <span className="truncate">{activeWorkspace.name}</span>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-background pb-14">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
