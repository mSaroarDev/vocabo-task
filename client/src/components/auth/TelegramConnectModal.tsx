import { useState, useEffect, useRef } from "react";
import { Check, ExternalLink, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TelegramConnectModal({ open, onOpenChange }: Props) {
  const { generateTelegramToken, refreshUser } = useAuth();
  const generateRef = useRef(generateTelegramToken);
  const refreshRef = useRef(refreshUser);
  generateRef.current = generateTelegramToken;
  refreshRef.current = refreshUser;
  const [token, setToken] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setToken(null);
      setBotUsername("");
      setConnected(false);
      setError(null);
      setLoading(true);
      generateRef.current()
        .then((data: { token: string; botUsername: string }) => {
          setToken(data.token);
          setBotUsername(data.botUsername);
        })
        .catch(() => setError("Failed to generate connect token"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const refreshedUser = await refreshRef.current();
      if (refreshedUser?.telegramConnected) {
        setConnected(true);
      } else {
        setError("Not connected yet. Open Telegram and tap Start.");
      }
    } catch {
      setError("Failed to check connection status");
    }
    setChecking(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[#0088cc]" />
              Connect Telegram
            </div>
          </DialogTitle>
          <DialogDescription>
            Link your account to receive notifications on Telegram
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : connected ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Check size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Connected Successfully!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your account is now linked to Telegram.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-md bg-[#2b2b2b] py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Click the button below to open Telegram and tap <strong>Start</strong> to link your account.
            </p>

            <a
              href={`https://t.me/${botUsername}?start=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-md bg-[#0088cc] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077b5]"
            >
              <ExternalLink size={14} />
              Open Telegram
            </a>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCheck}
                disabled={checking}
                className="flex-1 rounded-md bg-[#2b2b2b] py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {checking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {checking ? "Checking..." : "I've Done"}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
