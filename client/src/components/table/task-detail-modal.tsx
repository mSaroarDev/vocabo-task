import { useState, useEffect, useCallback, useRef } from "react";
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

interface TaskDetailModalProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onCreate?: (data: Partial<Task>, pendingAttachments?: File[]) => void;
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

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function renderCommentContent(content: string) {
  const parts = content.split(URL_REGEX);
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    URL_REGEX.lastIndex = 0;
    return <span key={index}>{part}</span>;
  });
}

function AttachmentCard({ attachment, onImagePreview, onRemove }: { attachment: Attachment; onImagePreview?: (urls: string[], index: number) => void; onRemove?: () => void }) {
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors group",
        isImage && "cursor-pointer"
      )}
      onClick={() => isImage && onImagePreview?.([attachment.url], 0)}
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
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          aria-label="Remove attachment"
        >
          <X size={14} />
        </button>
      )}
      {isImage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onImagePreview?.([attachment.url], 0); }}
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
  const [pendingAttachments, setPendingAttachments] = useState<{ file: File; preview: string }[]>([]);
  const currentUser = useAppSelector((state) => state.auth.user);
  const comments = useAppSelector((state) =>
    task ? (state.comments.byTask[task.id] ?? []) : []
  );
  const fetchedForRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const dispatch = useAppDispatch();

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

  const removeAttachment = useCallback(
    (attachmentId: string) => {
      if (!teamId || !workspaceId || !task?.id) return;
      dispatch(
        deleteTaskAttachment({ teamId, workspaceId, taskId: task.id, attachmentId })
      );
    },
    [dispatch, teamId, workspaceId, task?.id]
  );

  const removePendingAttachment = useCallback((preview: string) => {
    setPendingAttachments((prev) => {
      const target = prev.find((p) => p.preview === preview);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.preview !== preview);
    });
  }, []);

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
    dispatch(
      addComment({ teamId, workspaceId, taskId: task.id, content, author })
    );
  }, [commentText, task, teamId, workspaceId, currentUser, dispatch]);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!task || !teamId || !workspaceId) return;
      dispatch(
        deleteComment({ teamId, workspaceId, taskId: task.id, commentId })
      );
    },
    [task, teamId, workspaceId, dispatch]
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

  const handleCreate = () => {
    if (!titleValue.trim()) return;
    const files = pendingAttachments.map((p) => p.file);
    onCreate?.(
      {
        title: titleValue.trim(),
        description: descValue.trim() || undefined,
        status: statusValue,
        priority: priorityValue as Task["priority"],
      },
      files.length > 0 ? files : undefined
    );
    onOpenChange(false);
  };

  const priorityOptions = ["None", "Lowest", "Low", "Medium", "High", "Highest"];

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
      <h2 className="text-4xl font-bold text-foreground leading-snug px-1 py-0.5">
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
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Ignore close requests that originate while the confirm dialog is open
          if (!next && commentToDelete !== null) return;
          onOpenChange(next);
        }}
      >
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
                <div className="text-2xl">
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
                    {isCreate ? (
                      renderDropdown(
                        statusValue,
                        statusOptions.map((s) => ({ label: s.label, color: s.color })),
                        statusOpen,
                        setStatusOpen,
                        (v) => {
                          setStatusValue(v);
                          if (!isCreate && task) onUpdate?.(task.id, { status: v });
                        },
                        statusColors
                      )
                    ) : (
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", statusColors[task?.status || ""])}>
                        {task?.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                    {isCreate ? (
                      renderDropdown(
                        priorityValue,
                        priorityOptions.map((p) => ({ label: p })),
                        priorityOpen,
                        setPriorityOpen,
                        (v) => {
                          setPriorityValue(v as Task["priority"]);
                          if (!isCreate && task) onUpdate?.(task.id, { priority: v as Task["priority"] });
                        },
                        priorityColors
                      )
                    ) : (
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", priorityColors[task?.priority || ""])}>
                        {task?.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned To</label>
                  {isCreate ? (
                    <div className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
                      <User size={14} className="text-muted-foreground shrink-0" />
                      <input
                        value={assignedToName}
                        onChange={(e) => setAssignedToName(e.target.value)}
                        placeholder="Assign a person..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-1 py-1">
                      {task?.assignedTo?.avatar ? (
                        <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                          {task ? getInitials(task.assignedTo.name) : "?"}
                        </div>
                      )}
                      <span className="text-sm text-foreground">
                        {task?.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Created By (auto) */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Created By</label>
                  <div className="flex items-center gap-2 px-1 py-1">
                    {task?.createdBy?.avatar ? (
                      <img src={task.createdBy.avatar} alt={task.createdBy.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                        {task ? getInitials(task.createdBy.name) : getInitials("You")}
                      </div>
                    )}
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
                      onClick={() => setImagePickerOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>
                  
                  {/* Image thumbnails grid */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Existing image attachments */}
                     {!isCreate && task && task.attachments
                       .filter(a => a.mimeType.startsWith("image/"))
                       .map((attachment) => (
                         <div
                           key={attachment.id}
                           className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-foreground/50 transition-colors"
                         >
                           <img
                             src={attachment.url}
                             alt={attachment.originalName}
                             className="w-[50px] h-[80px] object-cover"
                           />
                           <button
                             onClick={() => removeAttachment(attachment.id)}
                             className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                             aria-label="Remove image"
                           >
                             <X size={10} />
                           </button>
                         </div>
                       ))}
                     
                     {/* Pending image attachments */}
                     {pendingAttachments
                       .filter(p => p.file.type.startsWith("image/"))
                       .map((p, i) => (
                         <div
                           key={`pending-${i}`}
                           className="relative rounded-lg overflow-hidden border border-border/50"
                         >
                           <img
                             src={p.preview}
                             alt="pending"
                             className="w-[50px] h-[80px] object-cover"
                           />
                           <button
                             onClick={() => removePendingAttachment(p.preview)}
                             className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                             aria-label="Remove image"
                           >
                             <X size={10} />
                           </button>
                         </div>
                       ))}
                    
                    {/* Add image placeholder - always shown */}
                    <button
                      onClick={() => setImagePickerOpen(true)}
                      className="flex items-center justify-center w-[50px] h-[80px] rounded-lg border-2 border-dashed border-border/50 hover:border-foreground/50 hover:bg-accent/30 transition-colors cursor-pointer"
                    >
                      <Plus size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Non-image attachments */}
                  <div className="space-y-2">
                    {!isCreate && task && task.attachments
                      .filter(a => !a.mimeType.startsWith("image/"))
                      .map((attachment) => (
                        <AttachmentCard key={attachment.id} attachment={attachment} onImagePreview={(urls, index) => { setPreviewUrls(urls); setPreviewIndex(index); }} onRemove={() => removeAttachment(attachment.id)} />
                      ))}
                    {pendingAttachments
                      .filter(p => !p.file.type.startsWith("image/"))
                      .map((p, i) => (
                        <div
                          key={`pending-${i}`}
                          className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-accent/20 group"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30">
                            <Paperclip size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.file.name}</p>
                            <p className="text-xs text-muted-foreground">Pending upload</p>
                          </div>
                          <button
                            onClick={() => removePendingAttachment(p.preview)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            aria-label="Remove attachment"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>

                  {/* Empty state - only show when no images at all */}
                  {((!isCreate && task && task.attachments.length === 0) || isCreate) && pendingAttachments.length === 0 && (
                    <div
                      onClick={() => setImagePickerOpen(true)}
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
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                      />
                    </div>
                  </div>

                  {/* Comments + Activity Feed — Timeline */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {comments.length === 0 && activity.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">No activity yet</div>
                    ) : (
                      <div className="relative">
                        {/* Vertical timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                        <div className="space-y-5">
                          {[...comments].reverse().map((item) => (
                            <div key={item.id} className="group relative flex items-start gap-3 w-full">
                              <div className="relative z-10 shrink-0">
                                {item.author.avatar ? (
                                  <img src={item.author.avatar} alt={item.author.name} className="h-6 w-6 rounded-full object-cover ring-4 ring-[#1a1a1a]" />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground ring-4 ring-[#1a1a1a]">
                                    {item.author.initials}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left -mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">{item.author.name}</span>{" "}
                                  commented
                                </p>
                                <p className="text-sm text-foreground break-words text-left">
                                  {renderCommentContent(item.content)}
                                  {item.isPending && <span className="ml-1 text-[11px] text-muted-foreground/50 italic">sending…</span>}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] text-muted-foreground/50">
                                    {formatTimeAgo(item.createdAt)}
                                  </p>
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
                                  <img src={item.performedBy.avatar} alt={item.performedBy.name} className="h-6 w-6 rounded-full object-cover ring-4 ring-[#1a1a1a]" />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground ring-4 ring-[#1a1a1a]">
                                    {getInitials(item.performedBy.name)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left -mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">{item.performedBy.name}</span>{" "}
                                  {formatActivity(item)}
                                </p>
                                <p className="text-[11px] text-muted-foreground/50">
                                  {formatTimeAgo(item.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
        onFileSelect={(file) => {
          if (isCreate) {
            const preview = URL.createObjectURL(file);
            setPendingAttachments((prev) => [...prev, { file, preview }]);
          } else {
            uploadViewAttachment(file);
          }
        }}
        onPaste={(file) => {
          if (isCreate) {
            const preview = URL.createObjectURL(file);
            setPendingAttachments((prev) => [...prev, { file, preview }]);
          } else {
            uploadViewAttachment(file);
          }
        }}
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
