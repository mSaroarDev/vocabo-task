import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ItemModal from "@/components/ui/item-modal";
import { useAppDispatch } from "@/store/hooks";
import { store } from "@/store";
import apiClient from "@/api/client";
import { setTeams } from "@/store/slices/teamsSlice";
import { updateProfile } from "@/store/slices/authSlice";
import type { Team as StoreTeam } from "@/store/slices/teamsSlice";
import type { User, Team } from "@/components/ui/settings/types";
import SettingsSidebar from "@/components/ui/settings/SettingsSidebar";
import MainContent from "@/components/ui/settings/MainContent";

const teamColors = [
  "bg-blue-500/20",
  "bg-purple-500/20",
  "bg-pink-500/20",
  "bg-amber-500/20",
  "bg-cyan-500/20",
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  teams: Team[];
  defaultTeamId: string | null;
  onSetDefaultTeam: (team: Team) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
  user,
  teams,
  defaultTeamId: initialDefaultTeamId,
  onSetDefaultTeam,
}: SettingsModalProps) {
  const dispatch = useAppDispatch();
  const [activeNav, setActiveNav] = useState("profile");
  const [defaultTeamId, setDefaultTeamId] = useState<string | null>(initialDefaultTeamId);
  const [limitCreation, setLimitCreation] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  // Radix fires the outer dialog's dismiss handlers from events that originate in
  // the nested modal (and from the focus/pointer fallout right after it unmounts),
  // so guard on a ref plus a short grace window instead of render state.
  const nestedModalGuard = useRef({ open: false, closedAt: 0 });

  const isNestedModalActive = () =>
    nestedModalGuard.current.open || Date.now() - nestedModalGuard.current.closedAt < 500;

  const setNestedModalActive = (active: boolean) => {
    nestedModalGuard.current = {
      open: active,
      closedAt: active ? 0 : Date.now(),
    };
  };

  const handleTeamModalOpenChange = (nextOpen: boolean) => {
    setNestedModalActive(nextOpen);
    setTeamModalOpen(nextOpen);
  };

  useEffect(() => {
    if (open) {
      setDefaultTeamId(initialDefaultTeamId);
    }
  }, [open, initialDefaultTeamId]);

  const handleSetDefaultTeam = async (team: Team) => {
    try {
      dispatch(updateProfile({ defaultTeam: team.id }));
    } catch (err) {
      console.error("Failed to save default team", err);
    }
    onSetDefaultTeam(team);
  };

  const handleCreateTeam = async (name: string) => {
    try {
      const response = await apiClient.post("/teams", { name });
      const data = response.data.data;
      const currentTeams = store.getState().teams.items;
      const newTeam: StoreTeam = {
        id: data._id,
        name: data.name,
        avatar: data.avatar || data.name.charAt(0).toUpperCase(),
        color: teamColors[currentTeams.length % teamColors.length],
        inviteCode: data.inviteCode,
        owner: data.owner,
        members: (data.members || []).map((m: any) => ({
          userId: typeof m.user === "object" ? m.user._id : m.user,
          name: typeof m.user === "object" ? m.user.name : "",
          email: typeof m.user === "object" ? m.user.email : "",
          avatar: typeof m.user === "object" ? m.user.avatar : undefined,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      };
      dispatch(setTeams([newTeam, ...store.getState().teams.items]));
    } catch (err) {
      console.error("Failed to create team", err);
    }
  };

  const handleDeleteTeam = async (team: { id: string; name: string }) => {
    const previousTeams: StoreTeam[] = store.getState().teams.items;
    dispatch(setTeams(previousTeams.filter((t) => t.id !== team.id)));
    try {
      await apiClient.delete(`/teams/${team.id}`);
    } catch (err) {
      dispatch(setTeams(previousTeams));
      throw err;
    }
  };

  return (
    <>
      <ItemModal
        open={teamModalOpen}
        onOpenChange={handleTeamModalOpenChange}
        title="Create teamspace"
        onSave={handleCreateTeam}
      />
      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen && isNestedModalActive()) return;
        onOpenChange(nextOpen);
      }}>
        <DialogContent
          className="flex h-[85vh] max-w-6xl flex-col overflow-hidden p-0"
          onPointerDownOutside={(event) => {
            if (isNestedModalActive()) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isNestedModalActive()) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (isNestedModalActive()) event.preventDefault();
          }}
        >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#858585] transition-colors hover:bg-[#2F2F2F] hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex flex-1 overflow-hidden">
          <SettingsSidebar user={user} activeNav={activeNav} onNavChange={setActiveNav} />
          <MainContent
            activeNav={activeNav}
            teams={teams}
            defaultTeamId={defaultTeamId}
            setDefaultTeamId={setDefaultTeamId}
            limitCreation={limitCreation}
            setLimitCreation={setLimitCreation}
            user={user}
            onSetDefaultTeam={handleSetDefaultTeam}
            onNewTeamspace={() => handleTeamModalOpenChange(true)}
            onNestedModalActiveChange={setNestedModalActive}
            onDeleteTeam={handleDeleteTeam}
          />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
