import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, ExternalLink, Send, Loader2, Smartphone } from "lucide-react";
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
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deepLink = token && botUsername ? `tg://resolve?domain=${botUsername}&start=${token}` : "";
  const webLink = token && botUsername ? `https://t.me/${botUsername}?start=${token}` : "";

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  }, []);

  useEffect(() => {
    if (open) {
      setToken(null);
      setBotUsername("");
      setConnected(false);
      setError(null);
      setPolling(false);
      setLoading(true);
      generateRef.current()
        .then((data: { token: string; botUsername: string }) => {
          setToken(data.token);
          setBotUsername(data.botUsername);
        })
        .catch(() => setError("Failed to generate connect token"))
        .finally(() => setLoading(false));
    } else {
      stopPolling();
    }
  }, [open, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startPolling = () => {
    setPolling(true);
    setError(null);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const user = await refreshRef.current();
        if (user?.telegramConnected) {
          setConnected(true);
          stopPolling();
        }
      } catch {
        // silent
      }
    }, 3000);
  };

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const refreshedUser = await refreshRef.current();
      if (refreshedUser?.telegramConnected) {
        setConnected(true);
        stopPolling();
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
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={webLink} size={180} />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Scan with your <strong>Telegram</strong> app to instantly connect
              </p>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#171717] px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!deepLink) return;
                window.location.href = deepLink;
                startPolling();
              }}
              disabled={!deepLink}
              className="flex items-center justify-center gap-2 w-full rounded-md bg-[#0088cc] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077b5] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Smartphone size={14} />
              Open Telegram App
            </button>

            <a
              href={webLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!webLink) {
                  e.preventDefault();
                  return;
                }
                startPolling();
              }}
              className={`flex items-center justify-center gap-2 w-full rounded-md bg-[#2b2b2b] py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[#3b3b3b] no-underline ${
                !webLink ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
              }`}
            >
              <ExternalLink size={14} />
              Open in Browser
            </a>

            {polling && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Waiting for connection...
              </div>
            )}

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
                {checking ? "Checking..." : "Check Connection"}
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
