import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  X,
  Paperclip,
  ExternalLink,
  ChevronDown,
  Plus,
  User,
  Loader2,
} from "lucide-react";
import type { Task, Attachment } from "./notion-table";
import type { StatusOption } from "./notion-table";
import apiClient from "@/api/client";
import { useAppDispatch } from "@/store/hooks";
import { addTaskAttachment } from "@/store/slices/tasksSlice";
import ImagePreview from "@/components/ui/image-preview";

const statusColors: Record<string, string> = {
  New: "bg-purple-500/20 text-purple-300",
  "In review": "bg-blue-600/20 text-blue-300",
  "Re Open": "bg-amber-500/20 text-amber-300",
  Done: "bg-green-600/20 text-green-300",
  Rejected: "bg-zinc-600/30 text-zinc-300",
};

const priorityColors: Record<string, string> = {
  Low: "bg-zinc-600/20 text-zinc-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-red-500/20 text-red-300",
  "Very High": "bg-red-600/30 text-red-200",
  Urgent: "bg-orange-600/30 text-orange-200",
  Immediate: "bg-rose-600/40 text-rose-200",
};

interface ActivityItem {
  _id: string;
  action: "created" | "updated" | "deleted";
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: { _id: string; name: string; email: string };
  createdAt: string;
}

interface TaskDetailModalProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onCreate?: (data: Partial<Task>) => Promise<Task | null | undefined> | void;
  statusOptions: StatusOption[];
  mode?: "view" | "create";
  loading?: boolean;
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
    case "deleted":
      return "deleted this task";
    case "updated":
      if (item.field === "status" && item.newValue) {
        return `changed status to ${item.newValue}`;
      }
      if (item.field === "priority" && item.newValue) {
        return `changed priority to ${item.newValue}`;
      }
      if (item.field === "isCompleted") {
        return item.newValue === "true" ? "marked as done" : "marked as not done";
      }
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

function AttachmentCard({ attachment, onImagePreview }: { attachment: Attachment; onImagePreview?: (url: string) => void }) {
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors group",
        isImage && "cursor-pointer"
      )}
      onClick={() => isImage && onImagePreview?.(attachment.url)}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30 overflow-hidden">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          <Paperclip size={16} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{attachment.originalName}</p>
        <p className="text-xs text-muted-foreground">Added {attachment.uploadedAt}</p>
      </div>
      {isImage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onImagePreview?.(attachment.url); }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  onCreate,
  statusOptions,
  loading,
  teamId,
  workspaceId,
  mode = "view",
}: TaskDetailModalProps) {
  const isCreate = mode === "create";

  const [titleValue, setTitleValue] = useState(task?.title || "");
  const [descValue, setDescValue] = useState(task?.description || "");
  const [statusValue, setStatusValue] = useState(task?.status || statusOptions[0]?.label || "In review");
  const [priorityValue, setPriorityValue] = useState(task?.priority || "Medium");
  const [assignedToName, setAssignedToName] = useState(task?.assignedTo?.name || "");
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!open || !task || !teamId || !workspaceId) {
      setActivity([]);
      return;
    }
    setActivityLoading(true);
    apiClient
      .get(`/teams/${teamId}/workspaces/${workspaceId}/tasks/${task.id}/activity`)
      .then((res) => setActivity(res.data.data as ActivityItem[]))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, [open, task?.id, teamId, workspaceId]);

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description || "");
      setStatusValue(task.status);
      setPriorityValue(task.priority);
      setAssignedToName(task.assignedTo?.name || "");
    }
  }, [task?.id, task?.title, task?.description, task?.status, task?.priority, task?.assignedTo?.name]);

  useEffect(() => {
    if (open && isCreate) {
      setTitleValue("");
      setDescValue("");
      setStatusValue(statusOptions[0]?.label || "In review");
      setPriorityValue("Medium");
      setAssignedToName("");
      setPendingAttachments([]);
    }
  }, [open, isCreate, statusOptions]);

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

  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const preview = URL.createObjectURL(file);
          if (isCreate) {
            setPendingAttachments((prev) => [...prev, { file, preview }]);
          } else {
            uploadViewAttachment(file);
            URL.revokeObjectURL(preview);
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [open, isCreate, uploadViewAttachment]);

  useEffect(() => {
    return () => {
      pendingAttachments.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [pendingAttachments]);

  const handleCreate = async () => {
    if (!titleValue.trim()) return;
    const createdTask = await onCreate?.({
      title: titleValue.trim(),
      description: descValue.trim() || undefined,
      status: statusValue,
      priority: priorityValue as Task["priority"],
    });
    if (createdTask && pendingAttachments.length > 0 && teamId && workspaceId) {
      setUploading(true);
      for (const pending of pendingAttachments) {
        try {
          await dispatch(
            addTaskAttachment({
              teamId,
              workspaceId,
              taskId: createdTask.id,
              file: pending.file,
            })
          ).unwrap();
        } catch {
          // individual upload failure — continue with the rest
        }
      }
      setPendingAttachments([]);
      setUploading(false);
    }
  };

  const priorityOptions = ["Low", "Medium", "High", "Very High", "Urgent", "Immediate"];

  const renderTitle = () => {
    if (isCreate) {
      return (
        <input
          autoFocus
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && titleValue.trim()) handleCreate();
            if (e.key === "Escape") onOpenChange(false);
          }}
          placeholder="Enter task title..."
          className="w-full bg-transparent border-b-2 border-foreground/20 focus:border-foreground/50 px-1 py-0.5 text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      );
    }
    return (
      <h2 className="text-lg font-bold text-foreground leading-snug px-1 py-0.5">
        {task?.title}
      </h2>
    );
  };

  const renderDropdown = (
    value: string,
    options: { label: string; color?: string }[],
    open: boolean,
    setOpen: (v: boolean) => void,
    onChange: (v: string) => void,
    colorMap?: Record<string, string>
  ) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-border/50 px-2.5 py-1.5 text-xs hover:bg-accent/50 transition-colors cursor-pointer",
          colorMap?.[value]
        )}
      >
        {value}
        <ChevronDown size={12} className="opacity-50" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[140px] w-full">
            {options.map((opt) => (
              <button
                key={opt.label}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer",
                  opt.color || colorMap?.[opt.label]
                )}
                onClick={() => {
                  onChange(opt.label);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-xl" style={{ maxHeight: "75vh" }}>
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-[#1a1a1a] shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isCreate ? "New Task" : "Task"}
            </span>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Split Layout */}
          <div className="flex flex-1 overflow-hidden" style={{ height: "calc(75vh - 50px)" }}>
            {/* Left Pane — Fields */}
            <div className="flex-1 flex flex-col border-r border-border/30 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Title */}
                <div>
                  {renderTitle()}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  {isCreate ? (
                    <textarea
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      placeholder="Add a description..."
                      className="w-full min-h-[100px] rounded-lg border border-border/50 bg-[#1a1a1a] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-border resize-none"
                    />
                  ) : (
                    <div className="rounded-lg border border-border/30 px-3 py-2.5 text-sm text-foreground min-h-[40px]">
                      {task?.description || (
                        <span className="text-muted-foreground/40">No description</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status + Priority row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                    {renderDropdown(
                      statusValue,
                      statusOptions.map((s) => ({ label: s.label, color: s.color })),
                      statusOpen,
                      setStatusOpen,
                      (v) => {
                        setStatusValue(v);
                        if (!isCreate && task) onUpdate?.(task.id, { status: v });
                      },
                      statusColors
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                    {renderDropdown(
                      priorityValue,
                      priorityOptions.map((p) => ({ label: p })),
                      priorityOpen,
                      setPriorityOpen,
                      (v) => {
                        setPriorityValue(v as Task["priority"]);
                        if (!isCreate && task) onUpdate?.(task.id, { priority: v as Task["priority"] });
                      },
                      priorityColors
                    )}
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned To</label>
                  <div className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
                    <User size={14} className="text-muted-foreground shrink-0" />
                    <input
                      value={isCreate ? assignedToName : (task?.assignedTo?.name || "")}
                      onChange={(e) => setAssignedToName(e.target.value)}
                      readOnly={!isCreate}
                      placeholder="Assign a person..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                    />
                  </div>
                </div>

                {/* Created By (auto) */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Created By</label>
                  <div className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                      {task ? getInitials(task.createdBy.name) : getInitials("You")}
                    </div>
                    <span className="text-sm text-foreground">
                      {task ? task.createdBy.name : "You"}
                    </span>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">Attachments</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                  />
                  <div className="space-y-2 mt-2">
                    {!isCreate && task && task.attachments.map((attachment) => (
                      <AttachmentCard key={attachment.id} attachment={attachment} onImagePreview={(url) => setPreviewUrl(url)} />
                    ))}
                    {pendingAttachments.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-accent/20"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30 overflow-hidden">
                          <img
                            src={p.preview}
                            alt="pasted"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.file.name}</p>
                          <p className="text-xs text-muted-foreground">Pending upload</p>
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
                  {((!isCreate && task && task.attachments.length === 0) || isCreate) && pendingAttachments.length === 0 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-dashed border-border/30 px-4 py-6 text-center text-xs text-muted-foreground cursor-pointer hover:border-border/50 hover:bg-accent/20 transition-colors"
                    >
                      Paste an image or click to upload
                    </div>
                  )}
                </div>
              </div>

              {/* Create button — stuck to bottom */}
              {isCreate && (
                <div className="shrink-0 px-6 pb-5 border-t border-border/30 pt-4">
                  <button
                    onClick={handleCreate}
                    disabled={!titleValue.trim() || loading}
                    className="w-full rounded-lg bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create Task"}
                  </button>
                </div>
              )}
            </div>

            {/* Right Pane — Activity */}
            <div className="w-[300px] shrink-0 flex flex-col bg-[#1a1a1a]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Activity
                </span>
              </div>

              {isCreate ? (
                <div className="flex-1 flex items-center justify-center px-5">
                  <p className="text-xs text-muted-foreground text-center">
                    Activity will appear here after the task is created.
                  </p>
                </div>
              ) : (
                <>
                  {/* Comment Input */}
                  <div className="px-5 py-3 border-b border-border/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                        Yo
                      </div>
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                      />
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {activityLoading ? (
                      <div className="text-xs text-muted-foreground text-center py-4">Loading activity...</div>
                    ) : activity.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">No activity yet</div>
                    ) : (
                      activity.map((item) => (
                        <div key={item._id} className="flex items-start gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground mt-0.5">
                            {getInitials(item.performedBy.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{item.performedBy.name}</span>{" "}
                              {formatActivity(item)}
                            </p>
                            <p className="text-[11px] text-muted-foreground/50">
                              {formatTimeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ImagePreview
        url={previewUrl || ""}
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
}
