import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import NotificationDrawer from "./notification-drawer";
import { selectUnreadCount } from "@/store/slices/notificationsSlice";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useAppSelector(selectUnreadCount);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
