import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MobileNav from "./mobile-nav";
import NotificationBell from "@/components/notifications/notification-bell";
import { useSocket } from "@/hooks/useSocket";
import { useAppDispatch } from "@/store/hooks";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { WorkspaceIcon } from "@/lib/workspace-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchChecklist } from "@/store/slices/checklistSlice";
import { fetchNotifications } from "@/store/slices/notificationsSlice";
import { fetchStickyNotes } from "@/store/slices/stickyNotesSlice";
import type { Workspace } from "@/store/slices/workspacesSlice";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  useSocket();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const stickyNotesFetched = useRef(false);
  useEffect(() => {
    if (stickyNotesFetched.current) return;
    stickyNotesFetched.current = true;
    dispatch(fetchStickyNotes());
  }, [dispatch]);

  const { teams, selectedTeam, setSelectedTeam } = useTeams();
  const { workspaces } = useWorkspaces(selectedTeam?.id);
  const activeWorkspaceId = searchParams.get("workspace");
  const activeWorkspace = workspaces.find((w: Workspace) => w.id === activeWorkspaceId);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center justify-between bg-background px-4">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Plano" className="h-5 w-5" />
          <span className="text-sm font-semibold text-foreground">Plano</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>
      {teams.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2">
          <Select
            value={selectedTeam?.id || ""}
            onValueChange={(id) => {
              const team = teams.find((t) => t.id === id);
              if (team) {
                setSelectedTeam(team);
                navigate("/dashboard");
              }
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id} className="text-xs">
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeWorkspace?.id || ""}
            onValueChange={(id) => navigate(`/dashboard?workspace=${id}`)}
          >
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <WorkspaceIcon name={ws.icon} size={14} />
                    {ws.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <main className="flex-1 overflow-auto bg-background pb-14">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
