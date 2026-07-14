import { useState, useRef } from "react";
import { ArrowLeft, Copy, Check, Camera, Loader2, LogOut, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/store/slices/teamsSlice";

interface TeamDetailsProps {
  team: Team;
  currentUserId: string;
  onBack: () => void;
  onLeaveTeam: (teamId: string, teamName: string) => void;
  onRemoveMember: (teamId: string, memberUserId: string, memberName: string) => void;
  onDeleteTeam?: (teamId: string, teamName: string) => void;
  onUploadAvatar?: (file: File) => void;
  onAddMember?: () => void;
  onMemberEmailChange?: (value: string) => void;
  memberEmail?: string;
  memberMessage?: string;
  addingMember?: boolean;
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type TabId = "basic-info" | "members" | "activity" | "settings";

const TABS: { id: TabId; label: string }[] = [
  { id: "basic-info", label: "Basic Info" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

export default function TeamDetails({
  team,
  currentUserId,
  onBack,
  onLeaveTeam,
  onRemoveMember,
  onDeleteTeam,
  onUploadAvatar,
  onAddMember,
  onMemberEmailChange,
  memberEmail,
  memberMessage,
  addingMember,
}: TeamDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("basic-info");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUserId === team.owner;
  const isImageAvatar = team.avatar.startsWith("http") || team.avatar.startsWith("/uploads");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAvatar) return;
    setUploading(true);
    try {
      await onUploadAvatar(file);
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to teams
      </button>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium overflow-hidden",
              !isImageAvatar && team.color
            )}
          >
            {isImageAvatar ? (
              <img src={team.avatar} alt={team.name} className="h-full w-full object-contain" />
            ) : (
              team.avatar
            )}
          </div>
          {isOwner && onUploadAvatar && (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-100"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Team ID: {team.inviteCode}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(team.inviteCode || "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              title="Copy invite code"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] max-w-3xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-3 py-2 text-sm transition-colors cursor-pointer",
              activeTab === tab.id
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2 max-w-3xl">
        {activeTab === "basic-info" && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm text-foreground font-medium">{team.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invite Code</span>
              <span className="text-sm text-foreground font-mono">{team.inviteCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Owner</span>
              <span className="text-sm text-foreground">
                {team.members?.find((m) => m.role === "owner")?.name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Members</span>
              <span className="text-sm text-foreground">{team.members?.length || 0}</span>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2 group"
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="h-7 w-7 rounded-full object-contain" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2b2b2b] text-xs font-medium">
                        {getUserInitials(member.name || "U")}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {member.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {member.role === "owner" ? (
                      <span className="text-xs text-muted-foreground">Owner</span>
                    ) : isOwner ? (
                      <button
                        onClick={() => onRemoveMember(team.id, member.userId, member.name || member.email)}
                        title="Remove member"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No members.</p>
              )}
            </div>

            {isOwner && onAddMember && (
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground mb-2">Add Member by Email</p>
                <div className="flex items-center gap-2">
                  <input
                    value={memberEmail || ""}
                    onChange={(e) => onMemberEmailChange?.(e.target.value)}
                    placeholder="member@example.com"
                    className="flex-1 rounded-md border border-white/[0.08] bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus:border-white/[0.15]"
                  />
                  <button
                    onClick={onAddMember}
                    disabled={addingMember || !memberEmail?.trim()}
                    className="rounded-md bg-[#2b2b2b] px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] disabled:opacity-50 cursor-pointer"
                  >
                    {addingMember ? "Adding..." : "Add"}
                  </button>
                </div>
                {memberMessage && (
                  <p
                    className={cn(
                      "text-xs mt-1.5",
                      memberMessage.includes("success")
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {memberMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Team Settings</p>
              <p className="text-xs text-muted-foreground">
                Additional settings will appear here in the future.
              </p>
            </div>

            {isOwner && onDeleteTeam && (
              <button
                onClick={() => onDeleteTeam(team.id, team.name)}
                className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
              >
                <Trash2 size={13} />
                Delete team
              </button>
            )}

            {!isOwner && (
              <button
                onClick={() => onLeaveTeam(team.id, team.name)}
                className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
              >
                <LogOut size={13} />
                Leave team
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
