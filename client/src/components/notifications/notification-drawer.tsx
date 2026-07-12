import { CheckCheck, Inbox } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectNotificationItems,
  selectUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationDoc,
  type NotificationType,
} from "@/store/slices/notificationsSlice";

const typeIcon: Record<NotificationType, string> = {
  task: "📝",
  comment: "💬",
  mention: "@",
  system: "⚙️",
};

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationDrawer({ open, onOpenChange }: NotificationDrawerProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?._id);
  const notifications = useAppSelector(selectNotificationItems);
  const unreadCount = useAppSelector(selectUnreadCount);

  const handleMarkRead = (id: string) => {
    if (!userId) return;
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    if (!userId) return;
    dispatch(markAllNotificationsRead());
  };

  const renderItem = (n: NotificationDoc) => {
    const unread = userId ? !n.seenBy.includes(userId) : false;
    return (
      <li
        key={n._id}
        onClick={() => unread && handleMarkRead(n._id)}
        className={cn(
          "flex gap-3 px-4 py-3 transition-colors hover:bg-accent",
          unread && "cursor-pointer bg-accent/40"
        )}
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">
          {typeIcon[n.type]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.body}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
        </div>
      </li>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          ) : (
            <SheetClose className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Close
            </SheetClose>
          )}
        </SheetHeader>
        <SheetDescription className="sr-only">
          Recent notifications for your account
        </SheetDescription>

        {notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <Inbox size={32} />
            <p className="text-sm">You're all caught up</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <ul className="divide-y divide-border">{notifications.map(renderItem)}</ul>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
