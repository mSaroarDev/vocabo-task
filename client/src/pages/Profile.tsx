import TelegramConnectModal from "@/components/auth/TelegramConnectModal";
import AccountSettingsTab from "@/components/profile/AccountSettingsTab";
import BasicInfoTab from "@/components/profile/BasicInfoTab";
import ProfileHeader from "@/components/profile/ProfileHeader";
import type { TabId } from "@/components/profile/ProfileTabs";
import ProfileTabs from "@/components/profile/ProfileTabs";
import TeamsTab from "@/components/profile/TeamsTab";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, deleteAccount, disconnectTelegram, uploadAvatar } = useAuth();
  const { teams, addTeamMember, removeTeamMember, deleteTeam, leaveTeam, uploadTeamAvatar } = useTeams();
  const [activeTab, setActiveTab] = useState<TabId>("basic-info");
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
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<{ teamId: string; teamName: string } | null>(null);
  const [confirmLeaveTeam, setConfirmLeaveTeam] = useState<{ teamId: string; teamName: string } | null>(null);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

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

  const handleDeleteTeam = async () => {
    if (!confirmDeleteTeam) return;
    try {
      await deleteTeam(confirmDeleteTeam.teamId);
    } catch {
      // error handled by Redux
    }
    setConfirmDeleteTeam(null);
  };

  const handleLeaveTeam = async () => {
    if (!confirmLeaveTeam) return;
    try {
      await leaveTeam(confirmLeaveTeam.teamId);
    } catch {
      // error handled by Redux
    }
    setConfirmLeaveTeam(null);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "basic-info":
        return (
          <div className="space-y-6">
            {user.telegramConnected ? (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-semibold text-foreground">✅ Connected</h3>
                <p className="text-xs text-muted-foreground mt-1">Your account is linked to Telegram</p>
                <ul className="mt-3 space-y-1.5">
                  <li className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-foreground mt-0.5">•</span>
                    Receive instant task assignment notifications
                  </li>
                  <li className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-foreground mt-0.5">•</span>
                    Get notified when you're mentioned in comments
                  </li>
                  <li className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-foreground mt-0.5">•</span>
                    Stay informed about team updates and changes
                  </li>
                </ul>
                <button
                  onClick={disconnectTelegram}
                  className="mt-4 flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
                >
                  <Send size={14} />
                  Disconnect
                </button>
              </div>
            ) : (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-foreground">Connect Telegram</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link your Telegram account to stay updated wherever you go.
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-foreground mt-0.5">•</span>
                      Receive instant task assignment notifications
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-foreground mt-0.5">•</span>
                      Get notified when you're mentioned in comments
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-foreground mt-0.5">•</span>
                      Stay informed about team updates and changes
                    </li>
                  </ul>
                  <button
                    onClick={() => setTelegramModalOpen(true)}
                    className="mt-4 flex items-center gap-2 rounded-md bg-[#0088cc] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0077b5] cursor-pointer"
                  >
                    <Send size={14} />
                    Connect Telegram
                  </button>
              </div>
            )}

            <BasicInfoTab
              name={name}
              phone={phone}
              email={email}
              saving={saving}
              saveMessage={saveMessage}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onEmailChange={setEmail}
              onSave={handleSave}
            />
          </div>
        );
      case "teams":
        return (
          <TeamsTab
            teams={teams}
            createdTeams={createdTeams}
            currentUserId={user._id}
            memberEmails={memberEmails}
            memberMessages={memberMessages}
            addingMember={addingMember}
            onMemberEmailChange={(teamId, value) =>
              setMemberEmails((prev) => ({ ...prev, [teamId]: value }))
            }
            onAddMember={handleAddMember}
            onRemoveMember={(teamId, memberUserId, memberName) =>
              setConfirmRemove({ teamId, memberUserId, memberName })
            }
            onDeleteTeam={(teamId, teamName) => setConfirmDeleteTeam({ teamId, teamName })}
            onLeaveTeam={(teamId, teamName) => setConfirmLeaveTeam({ teamId, teamName })}
            onUploadAvatar={(teamId, file) => uploadTeamAvatar(teamId, file)}
          />
        );
      case "settings":
        return (
          <div>
            <AccountSettingsTab
              confirmDelete={confirmDelete}
              deleteInput={deleteInput}
              onDeleteClick={() => setConfirmDelete(true)}
              onDeleteConfirm={handleDeleteAccount}
              onDeleteCancel={() => {
                setConfirmDelete(false);
                setDeleteInput("");
              }}
              onDeleteInputChange={setDeleteInput}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-6 py-10">
      <ProfileHeader
        name={user.name}
        email={user.email}
        initials={userInitials}
        avatar={user.avatar}
        onAvatarUpload={uploadAvatar}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {renderActiveTab()}

      <TelegramConnectModal open={telegramModalOpen} onOpenChange={setTelegramModalOpen} />

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

      {/* Leave Team Confirmation */}
      {confirmLeaveTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-6 shadow-xl">
            <h3 className="text-sm font-medium text-foreground mb-2">Leave Team</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to leave <strong className="text-foreground">{confirmLeaveTeam.teamName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmLeaveTeam(null)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveTeam}
                className="rounded-md bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 cursor-pointer"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation */}
      {confirmDeleteTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-6 shadow-xl">
            <h3 className="text-sm font-medium text-foreground mb-2">Delete Team</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <strong className="text-foreground">{confirmDeleteTeam.teamName}</strong>?
              This will permanently delete all workspaces, tasks, and data in this team.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteTeam(null)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
