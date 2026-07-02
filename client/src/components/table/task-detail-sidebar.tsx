import { X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "./notion-table";

const statusColors: Record<string, string> = {
  "In review": "bg-blue-600/20 text-blue-300",
  "Re Open": "bg-amber-500/20 text-amber-300",
  "Done": "bg-green-600/20 text-green-300",
  "Rejected": "bg-zinc-600/30 text-zinc-300",
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
            {/* Task Name */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Task Name</label>
              <p className="text-sm text-foreground leading-relaxed">{task.name}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</label>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  statusColors[task.status]
                )}
              >
                {task.status}
              </span>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</label>
              {task.priority ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600/20 text-red-300">
                  {task.priority}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground/50">None</span>
              )}
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

            {/* Attach File */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Attachments</label>
              {task.attachFile > 0 ? (
                <div className="flex items-center gap-2">
                  <Paperclip size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{task.attachFile} file{task.attachFile > 1 ? "s" : ""}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground/50">None</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
