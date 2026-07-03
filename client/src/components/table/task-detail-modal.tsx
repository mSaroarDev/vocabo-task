import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  X,
  Paperclip,
  ExternalLink,
  MoreHorizontal,
  SmilePlus,
  Reply,
  MessageSquare,
  CheckSquare,
  Tag,
  Calendar,
  ListChecks,
  UserPlus,
  AlignLeft,
  ChevronDown,
  ImageIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Task, Attachment } from "./notion-table";
import type { StatusOption } from "./notion-table";

const statusColors: Record<string, string> = {
  "In review": "bg-blue-600/20 text-blue-300",
  "Re Open": "bg-amber-500/20 text-amber-300",
  "Done": "bg-green-600/20 text-green-300",
  "Rejected": "bg-zinc-600/30 text-zinc-300",
};

const priorityColors: Record<string, string> = {
  None: "bg-zinc-600/20 text-zinc-300",
  Lowest: "bg-zinc-600/20 text-zinc-300",
  Low: "bg-zinc-600/20 text-zinc-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-600/20 text-orange-300",
  Highest: "bg-red-600/20 text-red-300",
};

interface TaskDetailModalProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onCreate?: (data: Partial<Task>) => void;
  statusOptions: StatusOption[];
  mode?: "view" | "create";
}

interface Comment {
  id: string;
  author: { name: string; initials: string; color: string };
  timestamp: string;
  text: string;
  image?: string;
  imageCaption?: string;
}

const commentData: Comment[] = [
  {
    id: "c1",
    author: { name: "Md. Nahiduzzaman", initials: "MN", color: "bg-blue-500/20 text-blue-300" },
    timestamp: "2h ago",
    text: "We should be able to edit/delete a message until it's seen by the recipient.",
    image: "",
    imageCaption: "Dark-themed chat window showing highlighted message bubble",
  },
  {
    id: "c2",
    author: { name: "Farnaz Bagheri", initials: "FB", color: "bg-purple-500/20 text-purple-300" },
    timestamp: "1h ago",
    text: "need more info",
  },
];

const quickActions = [
  { label: "Add", icon: CheckSquare },
  { label: "Labels", icon: Tag },
  { label: "Dates", icon: Calendar },
  { label: "Checklist", icon: ListChecks },
  { label: "Members", icon: UserPlus },
];

function QuickActionButton({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 transition-colors cursor-pointer">
      <Icon size={13} />
      {label}
    </button>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3 group">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          comment.author.color
        )}
      >
        {comment.author.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
        </div>
        {comment.image && (
          <div className="mb-2 rounded-lg border border-border/50 overflow-hidden bg-[#1a1a1a] max-w-[280px]">
            <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <ImageIcon size={24} className="text-muted-foreground/30" />
            </div>
          </div>
        )}
        {comment.imageCaption && (
          <p className="text-xs text-muted-foreground mb-2 italic">{comment.imageCaption}</p>
        )}
        <p className="text-sm text-foreground leading-relaxed mb-2">{comment.text}</p>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <SmilePlus size={14} />
          </button>
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Reply size={14} />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentCard({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors group">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-border/30 overflow-hidden">
        {attachment.mimeType.startsWith("image/") ? (
          <div className="h-full w-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <ImageIcon size={16} className="text-muted-foreground/50" />
          </div>
        ) : (
          <Paperclip size={16} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{attachment.originalName}</p>
        <p className="text-xs text-muted-foreground">Added {attachment.uploadedAt}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
          <ExternalLink size={14} />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
          <MoreHorizontal size={14} />
        </button>
      </div>
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
  mode = "view",
}: TaskDetailModalProps) {
  const isCreate = mode === "create";

  const [editingTitle, setEditingTitle] = useState(isCreate);
  const [titleValue, setTitleValue] = useState(task?.title || "");
  const [descEditing, setDescEditing] = useState(isCreate);
  const [descValue, setDescValue] = useState(task?.description || "");
  const [statusValue, setStatusValue] = useState(task?.status || statusOptions[0]?.label || "In review");
  const [priorityValue, setPriorityValue] = useState(task?.priority || "None");
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description || "");
      setStatusValue(task.status);
      setPriorityValue(task.priority);
    }
  }, [task?.id]);

  useEffect(() => {
    if (open && isCreate) {
      setTitleValue("");
      setDescValue("");
      setStatusValue(statusOptions[0]?.label || "In review");
      setPriorityValue("None");
      setEditingTitle(true);
      setDescEditing(true);
    }
  }, [open, isCreate]);

  const handleSaveTitle = () => {
    if (isCreate) return;
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== (task?.title || "")) {
      onUpdate?.(task!.id, { title: trimmed });
    } else {
      setTitleValue(task?.title || "");
    }
    setEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (isCreate) return;
    const trimmed = descValue.trim();
    if (trimmed !== ((task?.description || ""))) {
      onUpdate?.(task!.id, { description: trimmed || undefined });
    }
    setDescEditing(false);
  };

  const handleCreate = () => {
    if (!titleValue.trim()) return;
    onCreate?.({
      title: titleValue.trim(),
      description: descValue.trim() || undefined,
      status: statusValue,
      priority: priorityValue,
    });
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
    return editingTitle ? (
      <input
        autoFocus
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        onBlur={handleSaveTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSaveTitle();
          if (e.key === "Escape") {
            setTitleValue(task?.title || "");
            setEditingTitle(false);
          }
        }}
        className="w-full bg-transparent border-b-2 border-foreground/20 focus:border-foreground/50 px-1 py-0.5 text-lg font-bold text-foreground outline-none"
      />
    ) : (
      <h2
        className="text-lg font-bold text-foreground leading-snug cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5"
        onClick={() => {
          setTitleValue(task?.title || "");
          setEditingTitle(true);
        }}
      >
        {task?.title}
      </h2>
    );
  };

  const renderDescription = () => {
    if (isCreate) {
      return (
        <textarea
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          placeholder="Add a more detailed description..."
          className="w-full min-h-[80px] rounded-lg border border-border/50 bg-[#1a1a1a] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-border resize-none"
        />
      );
    }
    return descEditing ? (
      <textarea
        autoFocus
        value={descValue}
        onChange={(e) => setDescValue(e.target.value)}
        onBlur={handleSaveDesc}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSaveDesc();
          if (e.key === "Escape") {
            setDescValue(task?.description || "");
            setDescEditing(false);
          }
        }}
        placeholder="Add a more detailed description..."
        className="w-full min-h-[80px] rounded-lg border border-border/50 bg-[#1a1a1a] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-border resize-none"
      />
    ) : (
      <div
        className="rounded-lg border border-dashed border-border/30 px-3 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-accent/20 hover:border-border/50 transition-colors min-h-[40px]"
        onClick={() => {
          setDescValue(task?.description || "");
          setDescEditing(true);
        }}
      >
        {task?.description || (
          <span className="text-muted-foreground/40">Add a more detailed description...</span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden rounded-xl">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <MessageSquare size={14} />
              {isCreate ? "New Task" : "Chat & Support"}
              <ChevronDown size={12} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isCreate && (
              <>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                  <Paperclip size={15} />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                  <MoreHorizontal size={15} />
                </button>
              </>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex flex-1 overflow-hidden" style={{ maxHeight: "calc(90vh - 53px)" }}>
          {/* Left Pane — Task Details */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 border-r border-border/30">
            {/* Header: Checkbox + Title */}
            <div className="flex items-start gap-3">
              {!isCreate && (
                <input
                  type="checkbox"
                  checked={task?.isCompleted || false}
                  onChange={() => task && onUpdate?.(task.id, { isCompleted: !task.isCompleted })}
                  className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer accent-green-500"
                />
              )}
              <div className="flex-1 min-w-0">
                {renderTitle()}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {quickActions.map((action) => (
                <QuickActionButton key={action.label} label={action.label} icon={action.icon} />
              ))}
            </div>

            {/* Description Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</span>
              </div>
              {renderDescription()}
            </div>

            {/* Custom Fields Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</span>
                {!isCreate && (
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Priority</label>
                  <div className="relative">
                    <button
                      onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border border-border/50 px-2.5 py-1.5 text-xs",
                        "hover:bg-accent/50 transition-colors cursor-pointer",
                        priorityColors[isCreate ? priorityValue : (task?.priority || "None")]
                      )}
                    >
                      {priorityValue}
                      <ChevronDown size={12} className="opacity-50" />
                    </button>
                    {priorityOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPriorityOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[140px] w-full">
                          {priorityOptions.map((p) => (
                            <button
                              key={p}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer",
                                priorityColors[p]
                              )}
                              onClick={() => {
                                setPriorityValue(p as Task["priority"]);
                                if (!isCreate && task) {
                                  onUpdate?.(task.id, { priority: p as Task["priority"] });
                                }
                                setPriorityOpen(false);
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Status</label>
                  <div className="relative">
                    <button
                      onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border border-border/50 px-2.5 py-1.5 text-xs",
                        "hover:bg-accent/50 transition-colors cursor-pointer",
                        statusColors[statusValue]
                      )}
                    >
                      {statusValue}
                      <ChevronDown size={12} className="opacity-50" />
                    </button>
                    {statusOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[140px] w-full">
                          {statusOptions.map((s) => (
                            <button
                              key={s.label}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                              onClick={() => {
                                setStatusValue(s.label);
                                if (!isCreate && task) {
                                  onUpdate?.(task.id, { status: s.label });
                                }
                                setStatusOpen(false);
                              }}
                            >
                              <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", s.color)}>
                                {s.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Issue Raiser */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Issue Raiser</label>
                  <div className="flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5">
                    {task ? (
                      <>
                        <div className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium", task.createdBy.color)}>
                          {task.createdBy.initials}
                        </div>
                        <span className="text-xs text-foreground">{task.createdBy.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground opacity-50">You</span>
                    )}
                  </div>
                </div>

                {/* Resolved By */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Resolved By</label>
                  <div className="flex items-center rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span className="opacity-50">Select...</span>
                  </div>
                </div>

                {/* Verified By */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Verified By</label>
                  <div className="flex items-center rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span className="opacity-50">Select...</span>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Type</label>
                  <div className="flex items-center rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span className="opacity-50">Select...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {!isCreate && task && task.attachments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</span>
                  <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Plus size={13} />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <AttachmentCard key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Pane */}
          <div className="w-[340px] shrink-0 flex flex-col bg-[#1a1a1a]">
            {isCreate ? (
              <>
                {/* Section Header */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30">
                  <Sparkles size={15} className="text-amber-400" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Create Task</span>
                </div>

                {/* Tips */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div className="rounded-lg border border-border/30 p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Quick tips</h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-foreground mt-0.5">•</span>
                        Give your task a clear, descriptive title
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground mt-0.5">•</span>
                        Set priority to help team members understand urgency
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground mt-0.5">•</span>
                        Add a description with context and acceptance criteria
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-foreground mt-0.5">•</span>
                        Assign the task to a team member when ready
                      </li>
                    </ul>
                  </div>

                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Press <kbd className="px-1 py-0.5 rounded bg-accent text-foreground text-[10px] font-mono">Enter</kbd> to create quickly
                  </div>
                </div>

                {/* Create button */}
                <div className="px-5 py-4 border-t border-border/30">
                  <button
                    onClick={handleCreate}
                    disabled={!titleValue.trim()}
                    className="w-full rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Create Task
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Section Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comments and activity</span>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Show details
                  </button>
                </div>

                {/* Comment Input */}
                <div className="px-5 py-3 border-b border-border/30">
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
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  {commentData.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}

                  {/* System Action Note */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[9px] font-medium text-purple-300">
                      FB
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Farnaz Bagheri</span> added this card to{' '}
                        <span className="font-medium text-foreground">CHAT & SUPPORT</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground/50">3h ago</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
