import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialAccountsTabProps {
  telegramConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function SocialAccountsTab({
  telegramConnected,
  onConnect,
  onDisconnect,
}: SocialAccountsTabProps) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">
          {telegramConnected ? "✅ Connected" : "❌ Not Connected"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {telegramConnected
            ? "Your account is linked to Telegram"
            : "Connect to receive notifications on Telegram"}
        </p>
      </div>
      <button
        onClick={telegramConnected ? onDisconnect : onConnect}
        className={cn(
          "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
          telegramConnected
            ? "bg-[#2b2b2b] text-foreground hover:bg-[#3b3b3b]"
            : "bg-[#0088cc] text-white hover:bg-[#0077b5]"
        )}
      >
        <Send size={14} />
        {telegramConnected ? "Disconnect" : "Connect Telegram"}
      </button>
    </div>
  );
}
