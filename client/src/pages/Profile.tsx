import TelegramConnectModal from "@/components/auth/TelegramConnectModal";
import AccountSettingsTab from "@/components/profile/AccountSettingsTab";
import BasicInfoTab from "@/components/profile/BasicInfoTab";
import ProfileHeader from "@/components/profile/ProfileHeader";
import type { TabId } from "@/components/profile/ProfileTabs";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, deleteAccount, disconnectTelegram, uploadAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("basic-info");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

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
    </div>
  );
}
