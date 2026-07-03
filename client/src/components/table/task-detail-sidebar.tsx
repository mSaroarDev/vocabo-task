import { X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "./notion-table";

const statusColors: Record<string, string> = {
  "In review": "bg-blue-600/20 text-blue-300",
  "Re Open": "bg-amber-500/20 text-amber-300",
  "Done": "bg-green-600/20 text-green-300",
  "Rejected": "bg-zinc-600/30 text-zinc-300",
};

const priorityColors: Record<string, string> = {
  None: "text-muted-foreground/50",
  Lowest: "bg-zinc-600/20 text-zinc-300",
  Low: "bg-zinc-600/20 text-zinc-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-600/20 text-orange-300",
  Highest: "bg-red-600/20 text-red-300",
};

interface TaskDetailSidebarProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export default function TaskDetailSidebar({ task, open, onClose }: TaskDetailSidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[420px] bg-[#1a1a1a] border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Task details</span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Task Title */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Title</label>
              <p className="text-sm text-foreground leading-relaxed">{task.title}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</label>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
                  statusColors[task.status]
                )}
              >
                {task.status}
              </span>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</label>
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", priorityColors[task.priority])}>
                {task.priority}
              </span>
            </div>

            {/* Created By */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Created By</label>
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium", task.createdBy.color)}>
                  {task.createdBy.initials}
                </div>
                <span className="text-sm text-foreground">{task.createdBy.name}</span>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Assigned To</label>
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium", task.assignedTo.color)}>
                  {task.assignedTo.initials}
                </div>
                <span className="text-sm text-foreground">{task.assignedTo.name}</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                <p className="text-sm text-foreground/80 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Attachments</label>
                <div className="space-y-2">
                  {task.attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Paperclip size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{a.originalName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
