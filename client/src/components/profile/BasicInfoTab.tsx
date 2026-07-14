import { cn } from "@/lib/utils";

interface BasicInfoTabProps {
  name: string;
  phone: string;
  email: string;
  saving: boolean;
  saveMessage: string | null;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
}

export default function BasicInfoTab({
  name,
  phone,
  email,
  saving,
  saveMessage,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onSave,
}: BasicInfoTabProps) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Name</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
        <input
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+1234567890"
          className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/[0.15]"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
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
  );
}
