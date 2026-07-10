import { useCallback, type ReactNode } from "react";
import {
  Bell,
  PlusCircle,
  UserPlus,
  CheckCircle2,
  Trash2,
  ArrowUpDown,
  Folder,
  Users,
  MessageSquare,
  Paperclip,
  Tag,
  Edit,
  Archive,
  UserMinus,
  UserCheck,
  RotateCcw,
  Calendar,
  Move,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/store/slices/notificationsSlice";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const typeIconMap: Record<string, ReactNode> = {
  WORKSPACE_CREATED: <Folder size={16} />,
  WORKSPACE_UPDATED: <Edit size={16} />,
  WORKSPACE_ARCHIVED: <Archive size={16} />,
  MEMBER_INVITED: <UserPlus size={16} />,
  MEMBER_JOINED: <UserCheck size={16} />,
  MEMBER_REMOVED: <UserMinus size={16} />,
  ROLE_CHANGED: <Users size={16} />,
  TASK_CREATED: <PlusCircle size={16} />,
  TASK_UPDATED: <Edit size={16} />,
  TASK_DELETED: <Trash2 size={16} />,
  TASK_ASSIGNED: <UserPlus size={16} />,
  TASK_UNASSIGNED: <UserMinus size={16} />,
  TASK_COMPLETED: <CheckCircle2 size={16} />,
  TASK_REOPENED: <RotateCcw size={16} />,
  TASK_STATUS_CHANGED: <ArrowUpDown size={16} />,
  TASK_PRIORITY_CHANGED: <ArrowUpDown size={16} />,
  DUE_DATE_CHANGED: <Calendar size={16} />,
  TASK_MOVED: <Move size={16} />,
  TASK_RESTORED: <RotateCcw size={16} />,
  LIST_CREATED: <FileText size={16} />,
  LIST_RENAMED: <Edit size={16} />,
  LIST_DELETED: <Trash2 size={16} />,
  PROJECT_CREATED: <Folder size={16} />,
  PROJECT_UPDATED: <Edit size={16} />,
  PROJECT_ARCHIVED: <Archive size={16} />,
  COMMENT_ADDED: <MessageSquare size={16} />,
  COMMENT_EDITED: <Edit size={16} />,
  COMMENT_DELETED: <Trash2 size={16} />,
  FILE_UPLOADED: <Paperclip size={16} />,
  ATTACHMENT_REMOVED: <Paperclip size={16} />,
  LABEL_CREATED: <Tag size={16} />,
  LABEL_DELETED: <Trash2 size={16} />,
  LABEL_ASSIGNED: <Tag size={16} />,
  LABEL_REMOVED: <Tag size={16} />,
};

const typeColorMap: Record<string, string> = {
  WORKSPACE_CREATED: "text-blue-500",
  WORKSPACE_UPDATED: "text-blue-400",
  WORKSPACE_ARCHIVED: "text-yellow-500",
  MEMBER_INVITED: "text-green-500",
  MEMBER_JOINED: "text-green-400",
  MEMBER_REMOVED: "text-red-500",
  TASK_CREATED: "text-emerald-500",
  TASK_UPDATED: "text-blue-500",
  TASK_DELETED: "text-red-500",
  TASK_ASSIGNED: "text-purple-500",
  TASK_COMPLETED: "text-green-500",
  TASK_REOPENED: "text-amber-500",
  TASK_STATUS_CHANGED: "text-cyan-500",
  TASK_PRIORITY_CHANGED: "text-orange-500",
  FILE_UPLOADED: "text-indigo-500",
  COMMENT_ADDED: "text-pink-500",
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationItem({ notification, onMarkRead, onClick }: NotificationItemProps) {
  const handleClick = useCallback(() => {
    if (onMarkRead) {
      onMarkRead(notification._id);
    }
    if (onClick) {
      onClick(notification);
    }
  }, [notification._id, onMarkRead, onClick]);

  const icon = typeIconMap[notification.type] || <Bell size={16} />;
  const colorClass = typeColorMap[notification.type] || "text-muted-foreground";
  const timeAgo = getRelativeTime(notification.createdAt);

  return (
    <button
      onClick={handleClick}
      className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          colorClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground">
            <span className="font-semibold">
              {typeof notification.actorId === "object"
                ? notification.actorId.name
                : notification.actorName}
            </span>{" "}
            <span className="text-muted-foreground">{notification.title.toLowerCase()}</span>
          </p>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.description}
        </p>
      </div>
    </button>
  );
}
