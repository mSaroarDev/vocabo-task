import { cn } from "@/lib/utils";
import { Circle, CheckCircle2 } from "lucide-react";
import { priorityColors, type StatusOption, type Task } from "./types";
import { formatRelativeTime } from "./utils";

interface MobileTaskCardProps {
  task: Task;
  statusOptions: StatusOption[];
  onSelect?: (task: Task) => void;
}

export default function MobileTaskCard({ task, statusOptions, onSelect }: MobileTaskCardProps) {
  const statusColor = statusOptions.find((s) => s.label === task.status)?.color || "";
  const isUnassigned = task.assignedTo.name === "Unassigned";

  return (
    <div
      onClick={() => onSelect?.(task)}
      className="bg-[#252525] rounded-lg border border-border/50 shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-2.5 mb-3">
        {task.isCompleted ? (
          <CheckCircle2 size={18} className="text-green-400 mt-0.5 shrink-0" />
        ) : (
          <Circle size={18} className="text-muted-foreground mt-0.5 shrink-0" />
        )}
        <span className="text-sm text-foreground leading-snug font-medium">{task.title}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium", statusColor)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {task.status}
        </span>
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium", priorityColors[task.priority])}>
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {!isUnassigned ? (
            task.assignedTo.avatar ? (
              <img src={task.assignedTo.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-medium", task.assignedTo.color)}>
                {task.assignedTo.initials}
              </div>
            )
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[8px] font-medium text-muted-foreground">
              U
            </div>
          )}
          <span>{task.assignedTo.name}</span>
        </div>
        <span>{formatRelativeTime(task.createdAt)}</span>
      </div>
    </div>
  );
}
