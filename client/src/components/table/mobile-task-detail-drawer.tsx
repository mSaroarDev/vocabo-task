import { useState, useEffect, useCallback, useRef } from "react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  X,
  Paperclip,
  Plus,
  Loader2,
  MessageSquare,
} from "lucide-react";
import type { Task } from "./notion-table";
import apiClient from "@/api/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addTaskAttachment, deleteTaskAttachment } from "@/store/slices/tasksSlice";
import { fetchComments, addComment, deleteComment } from "@/store/slices/commentsSlice";
import ImagePreview from "@/components/ui/image-preview";
import ImagePickerModal from "./image-picker-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const statusColors: Record<string, string> = {
  New: "bg-purple-500/20 text-purple-300",
  "In progress": "bg-sky-500/20 text-sky-300",
  "In review": "bg-blue-600/20 text-blue-300",
  "Re Open": "bg-amber-500/20 text-amber-300",
  "Need info": "bg-yellow-500/20 text-yellow-300",
  Done: "bg-green-600/20 text-green-300",
  Duplicate: "bg-slate-600/20 text-slate-300",
  Invalid: "bg-red-600/20 text-red-300",
  Rejected: "bg-zinc-600/30 text-zinc-300",
};

const priorityColors: Record<string, string> = {
  None: "bg-zinc-600/20 text-zinc-300",
  Lowest: "bg-blue-500/20 text-blue-300",
  Low: "bg-sky-500/20 text-sky-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-500/20 text-orange-300",
  Highest: "bg-red-500/20 text-red-300",
};

interface ActivityItem {
  _id: string;
  action: "created" | "updated" | "deleted";
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
}

interface MobileTaskDetailDrawerProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  teamId?: string;
  workspaceId?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatActivity(item: ActivityItem): string {
  switch (item.action) {
    case "created":
      return "created this task";
    case "updated":
      if (item.field === "status" && item.newValue) return `changed status to ${item.newValue}`;
      if (item.field === "priority" && item.newValue) return `changed priority to ${item.newValue}`;
      if (item.field === "isCompleted") return item.newValue === "true" ? "marked as done" : "marked as not done";
      return `updated ${item.field ?? "task"}`;
    default:
      return "performed an action";
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function renderCommentContent(content: string) {
  const parts = content.split(URL_REGEX);
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline break-all">
          {part}
        </a>
      );
    }
    URL_REGEX.lastIndex = 0;
    return <span key={index}>{part}</span>;
  });
}

export default function MobileTaskDetailDrawer({
  task,
  open,
  onOpenChange,
  teamId,
  workspaceId,
}: MobileTaskDetailDrawerProps) {
  const [commentText, setCommentText] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const comments = useAppSelector((state) =>
    task ? (state.comments.byTask[task.id] ?? []) : []
  );
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !task || !teamId || !workspaceId) {
      fetchedForRef.current = null;
      setActivity([]);
      return;
    }
    const key = `${task.id}`;
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    dispatch(fetchComments({ teamId, workspaceId, taskId: task.id }));
    apiClient
      .get(`/teams/${teamId}/workspaces/${workspaceId}/tasks/${task.id}/activity`)
      .then((res) => setActivity(res.data.data as ActivityItem[]))
      .catch(() => setActivity([]));
  }, [open, task?.id, teamId, workspaceId, dispatch]);

  const uploadViewAttachment = useCallback(
    async (file: File) => {
      if (!teamId || !workspaceId || !task?.id) return;
      setUploading(true);
      try {
        await dispatch(addTaskAttachment({ teamId, workspaceId, taskId: task.id, file })).unwrap();
      } catch {
        // upload failed silently
      } finally {
        setUploading(false);
      }
    },
    [dispatch, teamId, workspaceId, task?.id]
  );

  const removeAttachment = useCallback(
    (attachmentId: string) => {
      if (!teamId || !workspaceId || !task?.id) return;
      dispatch(deleteTaskAttachment({ teamId, workspaceId, taskId: task.id, attachmentId }));
    },
    [dispatch, teamId, workspaceId, task?.id]
  );

  const handleAddComment = useCallback(() => {
    const content = commentText.trim();
    if (!content || !task || !teamId || !workspaceId || !currentUser) return;
    const author = {
      name: currentUser.name,
      initials: getInitials(currentUser.name),
      color: "#525252",
      avatar: currentUser.avatar,
    };
    setCommentText("");
    dispatch(addComment({ teamId, workspaceId, taskId: task.id, content, author }));
  }, [commentText, task, teamId, workspaceId, currentUser, dispatch]);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!task || !teamId || !workspaceId) return;
      dispatch(deleteComment({ teamId, workspaceId, taskId: task.id, commentId }));
    },
    [task, teamId, workspaceId, dispatch]
  );

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-0 pb-6">
          <div className="flex-1 overflow-y-auto px-4">
            {/* Task Details */}
            <div className="space-y-4 pt-4">
              {/* Title */}
              <h2 className="text-xl font-bold text-foreground leading-snug">
                {task?.title}
              </h2>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <div className="rounded-lg border border-border/30 px-3 py-2.5 text-sm text-foreground min-h-[40px]">
                  {task?.description || (
                    <span className="text-muted-foreground/40">No description</span>
                  )}
                </div>
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", statusColors[task?.status || ""])}>
                    {task?.status}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", priorityColors[task?.priority || ""])}>
                    {task?.priority}
                  </span>
                </div>
              </div>

              {/* Assigned To + Created By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned To</label>
                  <div className="flex items-center gap-2">
                    {task?.assignedTo?.avatar ? (
                      <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground">
                        {task ? getInitials(task.assignedTo.name) : "?"}
                      </div>
                    )}
                    <span className="text-sm text-foreground">{task?.assignedTo?.name || "Unassigned"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Created By</label>
                  <div className="flex items-center gap-2">
                    {task?.createdBy?.avatar ? (
                      <img src={task.createdBy.avatar} alt={task.createdBy.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground">
                        {task ? getInitials(task.createdBy.name) : getInitials("You")}
                      </div>
                    )}
                    <span className="text-sm text-foreground">{task?.createdBy?.name || "You"}</span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Attachments</label>
                  <button
                    onClick={() => setImagePickerOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {task && task.attachments
                    .filter(a => a.mimeType.startsWith("image/"))
                    .map((attachment) => (
                      <div key={attachment.id} className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-foreground/50 transition-colors">
                        <img src={attachment.url} alt={attachment.originalName} className="w-[50px] h-[80px] object-cover" />
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={() => setImagePickerOpen(true)}
                    className="flex items-center justify-center w-[50px] h-[80px] rounded-lg border-2 border-dashed border-border/50 hover:border-foreground/50 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <Plus size={16} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2">
                  {task && task.attachments
                    .filter(a => !a.mimeType.startsWith("image/"))
                    .map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors group">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30">
                          <Paperclip size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{attachment.originalName}</p>
                          <p className="text-xs text-muted-foreground">Added {attachment.uploadedAt}</p>
                        </div>
                      </div>
                    ))}
                  {uploading && (
                    <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>

                {task && task.attachments.length === 0 && (
                  <div
                    onClick={() => setImagePickerOpen(true)}
                    className="rounded-lg border border-dashed border-border/30 px-4 py-6 text-center text-xs text-muted-foreground cursor-pointer hover:border-border/50 hover:bg-accent/20 transition-colors"
                  >
                    Paste an image or click to upload
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-border/30" />

            {/* Comments Section */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comments</span>
              </div>

              {/* Comment Input */}
              <div className="flex items-center gap-2">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                    {currentUser ? getInitials(currentUser.name) : "Yo"}
                  </div>
                )}
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/30 focus:border-foreground/30 pb-1"
                />
              </div>

              {/* Comments + Activity Feed */}
              {comments.length === 0 && activity.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No activity yet</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {[...comments].reverse().map((item) => (
                      <div key={item.id} className="group relative flex items-start gap-3 w-full">
                        <div className="relative z-10 shrink-0">
                          {item.author.avatar ? (
                            <img src={item.author.avatar} alt={item.author.name} className="h-6 w-6 rounded-full object-cover ring-4 ring-[#0a0a0a]" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground ring-4 ring-[#0a0a0a]">
                              {item.author.initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left -mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{item.author.name}</span> commented
                          </p>
                          <p className="text-sm text-foreground break-words text-left">
                            {renderCommentContent(item.content)}
                            {item.isPending && <span className="ml-1 text-[11px] text-muted-foreground/50 italic">sending…</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-muted-foreground/50">{formatTimeAgo(item.createdAt)}</p>
                            {!item.isPending && (
                              <button
                                onClick={() => setCommentToDelete(item.id)}
                                className="text-[11px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activity.map((item) => (
                      <div key={item._id} className="group relative flex items-start gap-3 w-full">
                        <div className="relative z-10 shrink-0">
                          {item.performedBy.avatar ? (
                            <img src={item.performedBy.avatar} alt={item.performedBy.name} className="h-6 w-6 rounded-full object-cover ring-4 ring-[#0a0a0a]" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground ring-4 ring-[#0a0a0a]">
                              {getInitials(item.performedBy.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left -mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{item.performedBy.name}</span> {formatActivity(item)}
                          </p>
                          <p className="text-[11px] text-muted-foreground/50">{formatTimeAgo(item.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ImagePreview
        urls={previewUrls}
        index={previewIndex}
        open={previewUrls.length > 0}
        onClose={() => setPreviewUrls([])}
        onIndexChange={setPreviewIndex}
      />
      <ImagePickerModal
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        attachments={task?.attachments || []}
        onFileSelect={(file) => uploadViewAttachment(file)}
        onPaste={(file) => uploadViewAttachment(file)}
      />
      <ConfirmDialog
        open={commentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTimeout(() => setCommentToDelete(null), 0);
        }}
        title="Delete comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (commentToDelete) handleDeleteComment(commentToDelete);
        }}
      />
    </>
  );
}
