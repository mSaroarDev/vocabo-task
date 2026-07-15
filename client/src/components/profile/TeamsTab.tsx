import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/store/slices/teamsSlice";
import TeamDetails from "./TeamDetails";

interface TeamsTabProps {
  teams: Team[];
  createdTeams: Team[];
  currentUserId: string;
  memberEmails: Record<string, string>;
  memberMessages: Record<string, string>;
  addingMember: Record<string, boolean>;
  onMemberEmailChange: (teamId: string, value: string) => void;
  onAddMember: (teamId: string, role: string) => void;
  onRemoveMember: (teamId: string, memberUserId: string, memberName: string) => void;
  onUpdateMemberRole: (teamId: string, memberUserId: string, role: string) => void;
  onDeleteTeam: (teamId: string, teamName: string) => void;
  onLeaveTeam: (teamId: string, teamName: string) => void;
  onUploadAvatar: (teamId: string, file: File) => void;
}

export default function TeamsTab({
  teams,
  createdTeams,
  currentUserId,
  memberEmails,
  memberMessages,
  addingMember,
  onMemberEmailChange,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onDeleteTeam,
  onLeaveTeam,
  onUploadAvatar,
}: TeamsTabProps) {
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

  const detailTeam = teams.find((t) => t.id === detailTeamId) || null;

  if (detailTeam) {
    const isOwner = currentUserId === detailTeam.owner;
    const currentMemberRole = detailTeam.members?.find((m) => m.userId === currentUserId)?.role;
    const canAddMembers = isOwner || currentMemberRole === "project manager";
    return (
      <div className="space-y-8">
        <section>
          <TeamDetails
            team={detailTeam}
            currentUserId={currentUserId}
            onBack={() => setDetailTeamId(null)}
            onLeaveTeam={onLeaveTeam}
            onRemoveMember={onRemoveMember}
            onDeleteTeam={isOwner ? onDeleteTeam : undefined}
            onUploadAvatar={isOwner ? (file) => onUploadAvatar(detailTeam.id, file) : undefined}
            onAddMember={canAddMembers ? (role: string) => onAddMember(detailTeam.id, role) : undefined}
            onMemberEmailChange={canAddMembers ? (value) => onMemberEmailChange(detailTeam.id, value) : undefined}
            onUpdateMemberRole={canAddMembers ? (memberUserId: string, role: string) => onUpdateMemberRole(detailTeam.id, memberUserId, role) : undefined}
            memberEmail={canAddMembers ? memberEmails[detailTeam.id] || "" : undefined}
            memberMessage={canAddMembers ? memberMessages[detailTeam.id] : undefined}
            addingMember={canAddMembers ? addingMember[detailTeam.id] : undefined}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Joined Teams */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-4">Joined Teams</h2>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't joined any teams yet.</p>
        ) : (
          <div className="grid gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => setDetailTeamId(team.id)}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04]"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium overflow-hidden",
                    !(team.avatar.startsWith("http") || team.avatar.startsWith("/uploads")) && team.color
                  )}
                >
                  {team.avatar.startsWith("http") || team.avatar.startsWith("/uploads") ? (
                    <img src={team.avatar} alt={team.name} className="h-full w-full object-contain" />
                  ) : (
                    team.avatar
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Team ID: {team.inviteCode}
                  </p>
                </div>
                {currentUserId !== team.owner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeaveTeam(team.id, team.name);
                    }}
                    title="Leave team"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Created Teams */}
      {createdTeams.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">My Created Teams</h2>
          <div className="grid gap-3">
            {createdTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => setDetailTeamId(team.id)}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04]"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium overflow-hidden",
                    !(team.avatar.startsWith("http") || team.avatar.startsWith("/uploads")) && team.color
                  )}
                >
                  {team.avatar.startsWith("http") || team.avatar.startsWith("/uploads") ? (
                    <img src={team.avatar} alt={team.name} className="h-full w-full object-contain" />
                  ) : (
                    team.avatar
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Team ID: {team.inviteCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
