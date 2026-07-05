import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, deleteAccount } = useAuth();
  const { teams, addTeamMember, removeTeamMember } = useTeams();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  const [memberMessages, setMemberMessages] = useState<Record<string, string>>({});
  const [addingMember, setAddingMember] = useState<Record<string, boolean>>({});
  const [confirmRemove, setConfirmRemove] = useState<{ teamId: string; memberUserId: string; memberName: string } | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const createdTeams = teams.filter((t) => t.owner === user?._id);

  const userInitials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({ name, phone, email });
      setSaveMessage("Profile updated successfully");
    } catch {
      setSaveMessage("Failed to update profile");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate("/login", { replace: true });
    } catch {
      setSaveMessage("Failed to delete account");
    }
  };

  const handleAddMember = async (teamId: string) => {
    const memberEmail = memberEmails[teamId]?.trim();
    if (!memberEmail) return;

    setAddingMember((prev) => ({ ...prev, [teamId]: true }));
    setMemberMessages((prev) => ({ ...prev, [teamId]: "" }));
    try {
      await addTeamMember(teamId, memberEmail);
      setMemberMessages((prev) => ({ ...prev, [teamId]: "Member added successfully" }));
      setMemberEmails((prev) => ({ ...prev, [teamId]: "" }));
    } catch {
      setMemberMessages((prev) => ({ ...prev, [teamId]: "Failed to add member" }));
    }
    setAddingMember((prev) => ({ ...prev, [teamId]: false }));
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    try {
      await removeTeamMember(confirmRemove.teamId, confirmRemove.memberUserId);
    } catch {
      // error handled by Redux
    }
    setConfirmRemove(null);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2b2b2b] text-lg font-semibold text-foreground">
          {userInitials}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Edit Profile */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-foreground mb-4">Edit Profile</h2>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[#2b2b2b] px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saveMessage && (
              <span
                className={cn(
                  "text-xs",
                  saveMessage.includes("success") ? "text-green-400" : "text-red-400"
                )}
              >
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Joined Teams */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-foreground mb-4">Joined Teams</h2>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't joined any teams yet.</p>
        ) : (
          <div className="grid gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                    team.color
                  )}
                >
                  {team.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user._id === team.owner ? "Owner" : "Member"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Created Teams */}
      {createdTeams.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-foreground mb-4">My Created Teams</h2>
          <div className="grid gap-4">
            {createdTeams.map((team) => {
              const isExpanded = expandedTeams[team.id] ?? true;
              return (
                <div
                  key={team.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02]"
                >
                  <button
                    onClick={() =>
                      setExpandedTeams((prev) => ({
                        ...prev,
                        [team.id]: !isExpanded,
                      }))
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                        team.color
                      )}
                    >
                      {team.avatar}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Team ID: {team.inviteCode}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-3">
                      {/* Members List */}
                      {team.members && team.members.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Members ({team.members.length})
                          </p>
                          <div className="space-y-1.5">
                            {team.members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2 group"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2b2b] text-[10px] font-medium">
                                  {member.name
                                    ? member.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)
                                    : "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-foreground truncate">
                                    {member.name || "Unknown"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {member.email} {member.role === "owner" ? "(Owner)" : ""}
                                  </p>
                                </div>
                                {member.role !== "owner" && (
                                  <button
                                    onClick={() =>
                                      setConfirmRemove({
                                        teamId: team.id,
                                        memberUserId: member.userId,
                                        memberName: member.name || member.email,
                                      })
                                    }
                                    title="Remove member"
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Member */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Add Member by Email</p>
                        <div className="flex items-center gap-2">
                          <input
                            value={memberEmails[team.id] || ""}
                            onChange={(e) =>
                              setMemberEmails((prev) => ({ ...prev, [team.id]: e.target.value }))
                            }
                            placeholder="member@example.com"
                            className="flex-1 rounded-md border border-white/[0.08] bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus:border-white/[0.15]"
                          />
                          <button
                            onClick={() => handleAddMember(team.id)}
                            disabled={addingMember[team.id] || !memberEmails[team.id]?.trim()}
                            className="rounded-md bg-[#2b2b2b] px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] disabled:opacity-50 cursor-pointer"
                          >
                            {addingMember[team.id] ? "Adding..." : "Add"}
                          </button>
                        </div>
                        {memberMessages[team.id] && (
                          <p
                            className={cn(
                              "text-xs mt-1.5",
                              memberMessages[team.id].includes("success")
                                ? "text-green-400"
                                : "text-red-400"
                            )}
                          >
                            {memberMessages[team.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Remove Member Confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-6 shadow-xl">
            <h3 className="text-sm font-medium text-foreground mb-2">Remove Member</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to remove <strong className="text-foreground">{confirmRemove.memberName}</strong> from this team?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <section>
        <h2 className="text-sm font-medium text-red-400 mb-4">Danger Zone</h2>
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-5">
          {!confirmDelete ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                This action is irreversible. Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-md border border-red-500/30 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-red-500/50"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE"}
                  className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-30 cursor-pointer"
                >
                  Delete My Account
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteInput("");
                  }}
                  className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
