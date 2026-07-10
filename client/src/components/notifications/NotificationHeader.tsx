import { X, CheckCheck } from "lucide-react";

interface NotificationHeaderProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationHeader({ onClose, onMarkAllRead }: NotificationHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All activity inside this workspace
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <button
        onClick={onMarkAllRead}
        className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <CheckCheck size={14} />
        Mark all as read
      </button>
    </div>
  );
}
