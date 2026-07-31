import { useState, useRef } from "react";
import { Search, ChevronDown, Trash2, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Input } from "@/components/ui/input";
import ConfirmModal from "@/components/ui/confirm-modal";
import { addTeamMember, removeTeamMember, updateMemberRole, optimisticUpdateMemberRole, optimisticRemoveMember, fetchTeams } from "@/store/slices/teamsSlice";
import type { Team, TeamMember } from "@/store/slices/teamsSlice";

interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

const ROLE_OPTIONS = [
  { value: "project manager", label: "Project Manager" },
  { value: "member", label: "Member" },
  { value: "others", label: "Others" },
];

export default function TeamModal({ open, onOpenChange, team }: TeamModalProps) {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const liveTeam = useAppSelector((state) => state.teams.items.find((t) => t.id === team?.id)) || team;
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ member: TeamMember; role: string } | null>(null);
  const [pendingRemoveMember, setPendingRemoveMember] = useState<TeamMember | null>(null);
  const nestedModalGuard = useRef({ open: false, closedAt: 0 });

  const isNestedModalActive = () =>
    nestedModalGuard.current.open || Date.now() - nestedModalGuard.current.closedAt < 500;

  const handleNestedModalOpenChange = (nextOpen: boolean, reset: () => void) => {
    nestedModalGuard.current = {
      open: nextOpen,
      closedAt: nextOpen ? 0 : Date.now(),
    };
    if (!nextOpen) reset();
  };

  if (!liveTeam) return null;

  const owners = (liveTeam.members || []).filter((m) => m.role === "owner");
  const members = (liveTeam.members || []).filter((m) => m.role !== "owner");

  const handleAddMember = async () => {
    if (!email.trim()) return;
    setAddError(null);
    setAdding(true);
    try {
      await dispatch(addTeamMember({ teamId: liveTeam.id, email: email.trim(), role: "member" })).unwrap();
      setEmail("");
    } catch (err) {
      setAddError(typeof err === "string" ? err : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { member, role } = pendingRoleChange;
    const prevRole = member.role;
    dispatch(optimisticUpdateMemberRole({ teamId: liveTeam.id, memberUserId: member.userId, role }));
    setPendingRoleChange(null);
    try {
      await dispatch(updateMemberRole({ teamId: liveTeam.id, memberUserId: member.userId, role })).unwrap();
    } catch {
      dispatch(optimisticUpdateMemberRole({ teamId: liveTeam.id, memberUserId: member.userId, role: prevRole }));
    }
  };

  const confirmLabel = pendingRoleChange
    ? `Change ${pendingRoleChange.member.name || pendingRoleChange.member.email.split("@")[0]} role to ${ROLE_OPTIONS.find((r) => r.value === pendingRoleChange.role)?.label || pendingRoleChange.role}?`
    : "";

  const handleRemoveMember = async () => {
    if (!pendingRemoveMember) return;
    const member = pendingRemoveMember;
    dispatch(optimisticRemoveMember({ teamId: liveTeam.id, memberUserId: member.userId }));
    setPendingRemoveMember(null);
    try {
      await dispatch(removeTeamMember({ teamId: liveTeam.id, memberUserId: member.userId })).unwrap();
    } catch {
      dispatch(fetchTeams());
    }
  };

  const isCurrentUserOwner = currentUserId === liveTeam.owner;

  return (
    <>
      <ConfirmModal
        open={!!pendingRoleChange}
        onOpenChange={(next) => handleNestedModalOpenChange(next, () => setPendingRoleChange(null))}
        title="Change role?"
        description={confirmLabel}
        confirmText="Change"
        onConfirm={handleRoleChange}
      />
      <ConfirmModal
        open={!!pendingRemoveMember}
        onOpenChange={(next) => handleNestedModalOpenChange(next, () => setPendingRemoveMember(null))}
        title="Remove member?"
        description={pendingRemoveMember ? `Remove ${pendingRemoveMember.name || pendingRemoveMember.email.split("@")[0]} from this teamspace?` : ""}
        confirmText="Remove"
        variant="danger"
        onConfirm={handleRemoveMember}
      />
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isNestedModalActive()) return;
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent
          className="max-h-[90vh] max-w-2xl border-[#333] bg-[#1E1E1E] p-0 text-white"
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
        <DialogClose className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#858585] transition-colors hover:bg-[#2F2F2F] hover:text-white">
          <X size={15} />
        </DialogClose>
        <div className="flex items-start gap-4 border-b border-[#2F2F2F] px-8 pb-6 pt-8 pr-14">
          {liveTeam.avatar.startsWith("http") || liveTeam.avatar.startsWith("/uploads") ? (
            <img src={liveTeam.avatar} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white"
              style={{ backgroundColor: liveTeam.color || "#333" }}
            >
              {liveTeam.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{liveTeam.name}</h2>
            <p className="text-sm text-[#9B9B9B]">{(liveTeam.members || []).length} members</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#333] bg-[#2a2a2a] px-3 py-1 text-xs font-medium text-[#9B9B9B]">
            ✓ Joined
          </span>
        </div>

        <div className="border-b border-[#2F2F2F] px-8">
          <button className="relative pb-3 pt-4 text-sm font-medium text-white">
            Members
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          </button>
        </div>

        <div className="px-8 pb-5 pt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#858585]">Add member by email</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="Enter email address"
                className="pl-9"
              />
            </div>
            <button
              type="button"
              disabled={!email.trim() || adding}
              onClick={handleAddMember}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2B88D8] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2275c0]",
                (!email.trim() || adding) && "cursor-not-allowed opacity-50"
              )}
            >
              <Plus size={15} />
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
          {addError && (
            <p className="mt-1.5 text-xs text-red-400">{addError}</p>
          )}
        </div>

        <div className="overflow-y-auto px-8 pb-8">
          <div className="flex items-center border-b border-[#2F2F2F] pb-2">
            <span className="flex-1 text-xs font-medium uppercase tracking-wide text-[#858585]">Name</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#858585]">
              Role
            </span>
          </div>

          <div className="divide-y divide-[#2F2F2F]">
            {[...owners, ...members].map((member) => {
              const isOwner = member.role === "owner";
              const isSelf = member.userId === currentUserId;
              const canManage = isCurrentUserOwner && !isOwner;

              return (
                <div key={member.userId} className="flex items-center py-3.5">
                  <div className="flex flex-1 items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#555] text-xs font-medium text-white">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{member.name || member.email.split("@")[0]}</span>
                        {isSelf && <span className="text-xs text-[#858585]">(You)</span>}
                        {isOwner && (
                          <span className="rounded-md bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] font-medium text-[#9B9B9B]">Workspace owner</span>
                        )}
                      </div>
                      <p className="text-xs text-[#858585]">{member.email}</p>
                    </div>
                  </div>

                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 rounded-md border border-[#333] bg-[#252525] px-3 py-1.5 text-sm text-white outline-none transition-colors hover:border-[#555]">
                          {ROLE_OPTIONS.find((r) => r.value === member.role)?.label || member.role}
                          <ChevronDown size={12} className="text-[#858585]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ROLE_OPTIONS.map((role) => (
                          <DropdownMenuItem
                            key={role.value}
                            onClick={() => setPendingRoleChange({ member, role: role.value })}
                            className="flex items-center justify-between"
                          >
                            {role.label}
                            {member.role === role.value && <Check size={14} className="text-[#2B88D8]" />}
                          </DropdownMenuItem>
                        ))}
                        <div className="my-1 border-t border-[#333]" />
                        <DropdownMenuItem
                          onClick={() => {
                            setPendingRemoveMember(member);
                            nestedModalGuard.current = { open: true, closedAt: 0 };
                          }}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
                        >
                          <Trash2 size={14} />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="rounded-md border border-transparent bg-[#252525] px-3 py-1.5 text-sm text-white">
                      {ROLE_OPTIONS.find((r) => r.value === member.role)?.label || member.role}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
