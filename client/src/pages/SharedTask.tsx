import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2, Paperclip, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/api/client";
import ImagePreview from "@/components/ui/image-preview";
import { tagColorMap } from "@/components/table/types";
import type { Attachment } from "@/components/table/types";

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

interface SharedComment {
  _id: string;
  content: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface SharedTaskData {
  _id: string;
  title: string;
  status: string;
  priority: string;
  tags?: string[];
  description?: string;
  banner?: string;
  attachments: Attachment[];
  createdBy: { _id: string; name: string; email: string; avatar?: string };
  assignedTo?: { _id: string; name: string; email: string; avatar?: string };
  comments: SharedComment[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

export default function SharedTask() {
  const { nanoid } = useParams<{ nanoid: string }>();
  const [task, setTask] = useState<SharedTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (!nanoid) return;
    setLoading(true);
    apiClient
      .get(`/tasks/share/${nanoid}`)
      .then((res) => {
        setTask(res.data.data as SharedTaskData);
      })
      .catch(() => setError("Task not found or unavailable"))
      .finally(() => setLoading(false));
  }, [nanoid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading shared task...
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <AlertCircle size={40} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error || "Task not found"}</p>
      </div>
    );
  }

  const imageAttachments = (task.attachments || []).filter((a) => a.mimeType?.startsWith("image/"));
  const otherAttachments = (task.attachments || []).filter((a) => !a.mimeType?.startsWith("image/"));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 mb-6 rounded-xl border border-border/50 bg-[#1a1a1a]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Shared Task
          </span>
        </div>

        {/* Task Card */}
        <div className="rounded-xl border border-border/50 bg-[#1a1a1a] overflow-hidden">
          {/* Fields */}
          <div className="px-6 py-6 space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-bold text-foreground leading-snug">
              {task.title}
            </h1>

            {/* Description */}
            {task.description && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <p className="text-sm text-foreground px-3 py-2.5 rounded-lg border border-border/30 bg-[#1a1a1a]">
                  {task.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className={cn("px-2 py-1 text-xs", tagColorMap[tag] || "bg-zinc-600/20 text-zinc-300")}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", statusColors[task.status] || "")}>
                  {task.status}
                </span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", priorityColors[task.priority] || "")}>
                  {task.priority}
                </span>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned To</label>
              <div className="flex items-center gap-2 px-1 py-1">
                {task.assignedTo?.avatar ? (
                  <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                    {task.assignedTo ? getInitials(task.assignedTo.name) : "?"}
                  </div>
                )}
                <span className="text-sm text-foreground">
                  {task.assignedTo?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {/* Created By */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Created By</label>
              <div className="flex items-center gap-2 px-1 py-1">
                {task.createdBy?.avatar ? (
                  <img src={task.createdBy.avatar} alt={task.createdBy.name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
                    {task.createdBy ? getInitials(task.createdBy.name) : "?"}
                  </div>
                )}
                <span className="text-sm text-foreground">
                  {task.createdBy?.name || "Unknown"}
                </span>
              </div>
            </div>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Attachments</label>
                {imageAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {imageAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-foreground/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setPreviewUrls(imageAttachments.map((a) => a.url));
                          setPreviewIndex(imageAttachments.indexOf(attachment));
                        }}
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.originalName}
                          className="w-[50px] h-[80px] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {otherAttachments.length > 0 && (
                  <div className="space-y-2">
                    {otherAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30">
                          <Paperclip size={16} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{attachment.originalName}</p>
                          <p className="text-xs text-muted-foreground">Added {attachment.uploadedAt}</p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {task.comments && task.comments.length > 0 && (
          <div className="mt-6 rounded-xl border border-border/50 bg-[#1a1a1a] overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Comments
              </span>
            </div>
            <div className="px-5 py-4">
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-5">
                  {task.comments.map((item: any) => {
                    const author = item.author || {};
                    return (
                      <div key={item._id} className="group relative flex items-start gap-3 w-full">
                        <div className="relative z-10 shrink-0">
                          {author.avatar ? (
                            <img src={author.avatar} alt={author.name} className="h-6 w-6 rounded-full object-cover ring-4 ring-[#1a1a1a]" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground ring-4 ring-[#1a1a1a]">
                              {getInitials(author.name || "Unknown")}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left -mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{author.name || "Unknown"}</span>{" "}
                            commented
                          </p>
                          <p className="text-sm text-foreground break-words text-left">
                            {renderCommentContent(item.content)}
                          </p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            {formatTimeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ImagePreview
        urls={previewUrls}
        index={previewIndex}
        open={previewUrls.length > 0}
        onClose={() => setPreviewUrls([])}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
