import { useMemo } from "react";
import { Check, CheckCircle2, ClipboardList, Send } from "lucide-react";
import { GrInProgress } from "react-icons/gr";
import { cn } from "@/lib/utils";
import type { Task } from "@/components/table/types";

interface InProgressTasksWidgetProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
}

const IN_PROGRESS_KEYWORDS = ["progress", "ongoing", "running", "wip"];
const SUBMITTED_KEYWORDS = ["submitted", "in review", "pr raised", "pr created", "need approval", "ready for test"];

function matchesKeywords(status: string, keywords: string[]): boolean {
  const normalized = status.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function byMostRecent(a: Task, b: Task): number {
  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
}

const TIMELINE_STEPS = ["Created", "Assigned", "In Progress", "Submitted"] as const;
const ACTIVE_STEP_INDEX = 2;

const CIRCLE_SIZE = "h-7 w-7";

function TaskIconBox({ tone }: { tone: "active" | "success" }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
        tone === "active" ? "bg-yellow-500/10" : "bg-green-500/10",
      )}
    >
      {tone === "active" ? (
        <ClipboardList size={16} className="text-yellow-300" />
      ) : (
        <CheckCircle2 size={16} className="text-green-400" />
      )}
    </span>
  );
}

function StepCircle({ index, task }: { index: number; task: Task }) {
  const isActive = index === ACTIVE_STEP_INDEX;
  const isFuture = index > ACTIVE_STEP_INDEX;

  if (isActive) {
    return (
      <span className={cn("relative flex items-center justify-center", CIRCLE_SIZE)}>
        <span className="absolute h-full w-full rounded-full bg-yellow-400 opacity-60 blur-md animate-pulse" />
        <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
        <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-40 animate-ping [animation-delay:400ms]" />
        <span className="relative flex h-full w-full items-center justify-center rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50">
          <GrInProgress size={15} className="animate-spin text-white" style={{ animationDuration: "3s" }} />
        </span>
      </span>
    );
  }

  if (isFuture) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-zinc-700", CIRCLE_SIZE)}>
        <Send size={13} className="text-zinc-500" />
      </span>
    );
  }

  // "Created" step: a plain completed check
  if (index === 0) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-yellow-400", CIRCLE_SIZE)}>
        <Check size={15} className="text-white" />
      </span>
    );
  }

  // "Assigned" step: show the assignee's avatar
  const isUnassigned = task.assignedTo.name === "Unassigned";
  if (isUnassigned) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-zinc-600 text-[10px] font-medium text-muted-foreground ring-2 ring-yellow-400", CIRCLE_SIZE)}>
        U
      </span>
    );
  }
  if (task.assignedTo.avatar) {
    return <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className={cn("rounded-full object-cover ring-2 ring-yellow-400", CIRCLE_SIZE)} />;
  }
  return (
    <span className={cn("flex items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-yellow-400", CIRCLE_SIZE, task.assignedTo.color)}>
      {task.assignedTo.initials}
    </span>
  );
}

function TaskProgressTimeline({ task, onClick }: { task: Task; onClick?: () => void }) {
  const progressPercent = (ACTIVE_STEP_INDEX / (TIMELINE_STEPS.length - 1)) * 100;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-border/50 bg-[#252525] p-4 transition-colors hover:bg-[#2b2b2b]"
    >
      <div className="mb-5 flex items-center gap-3">
        <TaskIconBox tone="active" />
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
      </div>
      <div className="relative">
        <div className="absolute inset-x-3.5 top-3.5 h-0.5 -translate-y-1/2 rounded bg-zinc-700" />
        <div
          className="absolute left-3.5 top-3.5 h-0.5 -translate-y-1/2 rounded bg-yellow-400"
          style={{ right: `calc(100% - ${progressPercent}% - 0.875rem)` }}
        />
        <div className="relative flex items-center justify-between">
          {TIMELINE_STEPS.map((label, index) => (
            <StepCircle key={label} index={index} task={task} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {TIMELINE_STEPS.map((label, index) => {
          const isActive = index === ACTIVE_STEP_INDEX;
          const isFuture = index > ACTIVE_STEP_INDEX;
          return (
            <span
              key={label}
              className={cn(
                "whitespace-nowrap text-[10px] font-medium",
                isFuture ? "text-muted-foreground/50" : "text-muted-foreground",
                isActive && "text-yellow-300",
              )}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SubmittedTaskRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const isUnassigned = task.assignedTo.name === "Unassigned";

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-[#252525] px-4 py-3 transition-colors hover:bg-[#2b2b2b]"
    >
      <TaskIconBox tone="success" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center rounded bg-green-500/15 px-1.5 py-0.5 font-medium text-green-300">
            {task.status}
          </span>
          {task.workspaceName && <span className="truncate">{task.workspaceName}</span>}
        </div>
      </div>
      {!isUnassigned &&
        (task.assignedTo.avatar ? (
          <img src={task.assignedTo.avatar} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium",
              task.assignedTo.color,
            )}
          >
            {task.assignedTo.initials}
          </div>
        ))}
    </div>
  );
}

export default function InProgressTasksWidget({ tasks, isLoading, onTaskClick }: InProgressTasksWidgetProps) {
  const inProgressTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.isCompleted && matchesKeywords(task.status, IN_PROGRESS_KEYWORDS))
        .sort(byMostRecent)
        .slice(0, 5),
    [tasks],
  );

  const submittedTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.isCompleted && matchesKeywords(task.status, SUBMITTED_KEYWORDS))
        .sort(byMostRecent)
        .slice(0, 5),
    [tasks],
  );

  if (isLoading || (inProgressTasks.length === 0 && submittedTasks.length === 0)) return null;

  return (
    <>
      {inProgressTasks.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <GrInProgress size={12} className="animate-spin text-yellow-400" style={{ animationDuration: "3s" }} />
              In Progress
            </h2>
            <span className="text-[11px] text-muted-foreground">{inProgressTasks.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {inProgressTasks.map((task) => (
              <TaskProgressTimeline key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
            ))}
          </div>
        </section>
      )}

      {submittedTasks.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-400" />
              Submitted
            </h2>
            <span className="text-[11px] text-muted-foreground">{submittedTasks.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {submittedTasks.map((task) => (
              <SubmittedTaskRow key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
