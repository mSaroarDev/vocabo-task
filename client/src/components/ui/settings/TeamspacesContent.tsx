import { useState } from "react";
import { ChevronDown, Plus, MoreHorizontal, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { leaveTeam } from "@/store/slices/teamsSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ConfirmModal from "@/components/ui/confirm-modal";
import TeamModal from "@/components/ui/settings/TeamModal";
import type { Team as StoreTeam } from "@/store/slices/teamsSlice";
import type { Team } from "./types";

interface WorkspacesContentProps {
  teams: Team[];
  defaultTeamId: string | null;
  setDefaultTeamId: (id: string | null) => void;
  limitCreation: boolean;
  setLimitCreation: (v: boolean) => void;
  onSetDefaultTeam: (team: Team) => void;
  onNewTeamspace: () => void;
  onNestedModalActiveChange: (active: boolean) => void;
  onDeleteTeam: (team: { id: string; name: string }) => Promise<void>;
}

export default function WorkspacesContent({
  teams,
  defaultTeamId,
  setDefaultTeamId,
  limitCreation,
  setLimitCreation,
  onSetDefaultTeam,
  onNewTeamspace,
  onNestedModalActiveChange,
  onDeleteTeam,
}: WorkspacesContentProps) {
  const dispatch = useAppDispatch();
  const teamsFromStore = useAppSelector((state) => state.teams.items);
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const [saved, setSaved] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [teamPendingDelete, setTeamPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedTeamModal, setSelectedTeamModal] = useState<StoreTeam | null>(null);
  const selectedTeam = teams.find((t) => t.id === defaultTeamId);

  const handleLeave = async (teamId: string) => {
    setOpenDropdownId(null);
    setLeaveError(null);
    try {
      await dispatch(leaveTeam(teamId)).unwrap();
    } catch (err) {
      setLeaveError(typeof err === "string" ? err : "Failed to leave teamspace");
    }
  };

  const handleDelete = async (team: { id: string; name: string }) => {
    setDeleteError(null);
    try {
      await onDeleteTeam(team);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setDeleteError(apiError.response?.data?.message || "Failed to delete teamspace");
    }
  };

  const handleUpdate = () => {
    if (!selectedTeam) return;
    onSetDefaultTeam(selectedTeam);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <ConfirmModal
        open={!!teamPendingDelete}
        onOpenChange={(nextOpen) => {
          onNestedModalActiveChange(nextOpen);
          if (!nextOpen) setTeamPendingDelete(null);
        }}
        title="Delete teamspace?"
        description={
          teamPendingDelete
            ? `"${teamPendingDelete.name}" and all of its data will be permanently deleted. This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          if (teamPendingDelete) handleDelete(teamPendingDelete);
          setTeamPendingDelete(null);
        }}
      />
      <TeamModal
        open={!!selectedTeamModal}
        onOpenChange={(next) => { if (!next) setSelectedTeamModal(null); }}
        team={selectedTeamModal}
      />
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-white">Teamspaces</h1>
        <p className="mt-1 text-sm text-[#9B9B9B]">
          Manage teamspaces in this workspace{" "}
          <a href="#" className="text-[#2F80ED] hover:underline">
            Learn more
          </a>
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-white">Default teamspace</h2>
        <p className="mt-1 text-sm text-[#858585]">
          Choose which teamspace all existing and new workspace members should automatically join
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Select
            value={defaultTeamId || ""}
            onValueChange={(val) => setDefaultTeamId(val || null)}
          >
            <SelectTrigger className="flex-1">
              {selectedTeam ? (
                <div className="flex min-w-0 items-center gap-2">
                  {selectedTeam.avatar.startsWith("http") || selectedTeam.avatar.startsWith("/uploads") ? (
                    <img src={selectedTeam.avatar} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                      style={{ backgroundColor: selectedTeam.color || "#555" }}
                    >
                      {selectedTeam.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{selectedTeam.name}</span>
                </div>
              ) : (
                <span>Select a teamspace</span>
              )}
            </SelectTrigger>
            <SelectContent>
              {teams.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No teams available
                </div>
              ) : (
                teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.avatar.startsWith("http") || team.avatar.startsWith("/uploads") ? (
                      <img src={team.avatar} alt="" className="mr-2 inline-block h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <span
                        className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: team.color || "#555" }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {team.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <button
            type="button"
            disabled={!selectedTeam}
            onClick={handleUpdate}
            className={cn(
              "cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-white transition-colors",
              saved
                ? "bg-[#22c55e]"
                : selectedTeam
                  ? "bg-[#2383E2] hover:bg-[#1a6bbf]"
                  : "cursor-not-allowed bg-[#454545] opacity-50"
            )}
          >
            {saved ? "Saved" : "Update"}
          </button>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between border-b border-[#2F2F2F] pb-8">
        <div>
          <h2 className="text-sm font-medium text-white">
            Limit teamspace creation to workspace owners
          </h2>
          <p className="mt-0.5 text-sm text-[#858585]">
            Allow only workspace owners to create teamspaces
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={limitCreation}
          onClick={() => setLimitCreation(!limitCreation)}
          className={cn(
            "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
            limitCreation ? "bg-[#2383E2]" : "bg-[#454545]"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              limitCreation && "translate-x-4"
            )}
          />
        </button>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">Teamspaces</h2>
            <p className="mt-0.5 text-sm text-[#858585]">
              Manage all teamspaces you have access to here
            </p>
          </div>
        </div>

        {(leaveError || deleteError) && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {leaveError || deleteError}
          </div>
        )}

        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onNewTeamspace}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2383E2] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a6bbf]"
          >
            <Plus size={15} />
            New teamspace
          </button>
        </div>

        <div className="overflow-hidden rounded-md border border-[#2F2F2F]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2F2F2F] text-xs text-[#858585]">
                <th className="px-4 py-2.5 font-medium">Teamspace</th>
                <th className="px-4 py-2.5 font-medium">Owners</th>
                <th className="px-4 py-2.5 font-medium">Access</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="inline-flex cursor-pointer items-center gap-1">
                    Updated
                    <ChevronDown size={10} />
                  </span>
                </th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {teamsFromStore.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#858585]">
                    No teamspaces yet
                  </td>
                </tr>
              ) : (
                teamsFromStore.map((team) => {
                  const owners = (team.members || []).filter((m) => m.role === "owner");
                  const memberCount = team.members?.length || 0;
                  const isOwner = owners.some((o) => o.userId === team.owner);
                  const isCurrentUserOwner = currentUserId === team.owner;

                  return (
                    <tr
                      key={team.id}
                      className="cursor-pointer border-b border-[#2F2F2F] last:border-0"
                      onClick={() => setSelectedTeamModal(team)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {team.avatar.startsWith("http") || team.avatar.startsWith("/uploads") ? (
                            <img src={team.avatar} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white"
                              style={{ backgroundColor: team.color || "#333" }}
                            >
                              {team.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {team.name}
                            </p>
                            <p className="text-xs text-[#858585]">
                              {memberCount} {memberCount === 1 ? "member" : "members"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {owners.length === 0 ? (
                            <span className="text-sm text-[#858585]">—</span>
                          ) : (
                            owners.slice(0, 3).map((owner) => (
                              <div key={owner.userId} className="flex items-center gap-1.5">
                                {owner.avatar ? (
                                  <img
                                    src={owner.avatar}
                                    alt=""
                                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                                    title={owner.name || owner.email}
                                  />
                                ) : (
                                  <div
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#555] text-[10px] font-medium text-white"
                                    title={owner.name || owner.email}
                                  >
                                    {(owner.name || owner.email).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate text-sm text-white max-w-[100px]">
                                  {owner.name || owner.email.split("@")[0]}
                                </span>
                              </div>
                            ))
                          )}
                          {owners.length > 3 && (
                            <span className="text-sm text-[#858585]">+{owners.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md border border-[#333] px-2.5 py-1 text-sm text-[#9B9B9B]">
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9B9B9B]">—</td>
                      <td className="px-4 py-3">
                        <DropdownMenu
                          open={openDropdownId === team.id}
                          onOpenChange={(next) => setOpenDropdownId(next ? team.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#858585] transition-colors hover:bg-[#2F2F2F] hover:text-white"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={isCurrentUserOwner}
                              title={isCurrentUserOwner ? "Owners must delete the teamspace instead of leaving" : undefined}
                              onClick={() => handleLeave(team.id)}
                              className={cn(
                                isCurrentUserOwner ? "text-red-400/40" : "text-red-400"
                              )}
                            >
                              <LogOut size={14} />
                              Leave teamspace
                            </DropdownMenuItem>
                            {isCurrentUserOwner && (
                              <DropdownMenuItem
                                onClick={() => {
                                  onNestedModalActiveChange(true);
                                  setTeamPendingDelete({ id: team.id, name: team.name });
                                }}
                                className="text-red-400"
                              >
                                <Trash2 size={14} />
                                Delete teamspace
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-12" />
    </div>
  );
}
