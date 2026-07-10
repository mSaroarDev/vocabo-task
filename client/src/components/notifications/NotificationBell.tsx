import { Bell } from "lucide-react";
import NotificationBadge from "./NotificationBadge";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export default function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell size={18} />
      <NotificationBadge count={unreadCount} />
    </button>
  );
}
