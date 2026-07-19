import { CgRatio } from "react-icons/cg";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../utils";
import type { CellRenderProps, Task } from "../types";
import { tagColorMap } from "../types";
import { Badge } from "@/components/ui/badge";
import { PersonCell, AssigneeCell } from "./PersonCell";
import { StatusCell } from "./StatusCell";
import { PriorityCell } from "./PriorityCell";
import { AttachmentCell } from "./AttachmentCell";
import { DescriptionEditor } from "./DescriptionEditor";

export function renderCellContent(
  task: Task,
  columnKey: string,
  props: CellRenderProps
) {
  const {
    onSelect,
    onStatusUpdate,
    statusOptions,
    wrapTaskName,
    onImagePreview,
    onPriorityUpdate,
    onAssigneeUpdate,
    members,
    editingTaskId,
    editingField,
    editingValue,
    editingInputRef,
    onStartEdit,
    onEditingChange,
    onSaveEdit,
    onCancelEdit,
    teamId,
    workspaceId,
  } = props;

  const isEditing = editingTaskId === task.id && editingField === columnKey;
  switch (columnKey) {
    case "title":
      if (isEditing) {
        return (
          <input
            ref={editingInputRef}
            autoFocus
            value={editingValue}
            onChange={(e) => onEditingChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSaveEdit?.(task.id, editingValue || "");
              }
              if (e.key === "Escape") {
                onCancelEdit?.();
              }
            }}
            onBlur={() => onSaveEdit?.(task.id, editingValue || "")}
            className="w-full bg-transparent text-sm text-foreground outline-none border-b border-foreground/20 focus:border-foreground/50 px-1 py-0.5"
          />
        );
      }
      return (
        <span className="inline-flex items-center w-full justify-between">
          <span
            className={cn(
              "cursor-pointer rounded px-0.5 -mx-0.5 py-0.5 hover:bg-accent/50 text-sm leading-tight min-w-0 inline-flex items-center gap-1",
              wrapTaskName ? "whitespace-normal flex-wrap" : "truncate"
            )}
            onClick={() => onStartEdit?.(task, "title")}
          >
            {task.tags?.map((tag) => (
              <Badge
                key={tag}
                className={cn("shrink-0 gap-1 px-2 py-1 text-xs", tagColorMap[tag] || "bg-zinc-600/20 text-zinc-300")}
              >
                {tag}
              </Badge>
            ))}
            <span className={cn(wrapTaskName ? "whitespace-normal" : "truncate", "min-w-0")}>
              {task.title}
            </span>
          </span>
          <button
            onClick={() => onSelect(task)}
            className="invisible group-hover:visible inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer shrink-0"
            title="View task details"
          >
            <CgRatio size={12} />
            View
          </button>
        </span>
      );
    case "status":
      return <StatusCell statusOptions={statusOptions} task={task} onUpdate={onStatusUpdate} />;
    case "priority":
      return <PriorityCell task={task} onUpdate={onPriorityUpdate} />;
    case "description":
      return (
        <DescriptionEditor
          task={task}
          isEditing={isEditing}
          editingValue={editingValue}
          onStartEdit={onStartEdit}
          onEditingChange={onEditingChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      );
    case "createdBy": {
      const createdAt = formatRelativeTime(task.createdAt);
      return <PersonCell person={task.createdBy} meta={createdAt} />;
    }
    case "attachments":
      return <AttachmentCell task={task} teamId={teamId} workspaceId={workspaceId} onImagePreview={onImagePreview} />;
    case "addedOn":
      return <span className="truncate text-xs text-muted-foreground">{formatRelativeTime(task.createdAt)}</span>;
    case "workspace":
      return <span className="truncate text-xs text-muted-foreground">{task.workspaceName || "—"}</span>;
    case "assignedTo":
    case "assignee":
      return <AssigneeCell task={task} members={members} onUpdate={onAssigneeUpdate} />;
    default:
      if (task.customFields?.[columnKey] !== undefined) {
        return <span className="text-sm text-foreground">{String(task.customFields[columnKey])}</span>;
      }
      return <span className="text-muted-foreground/30">—</span>;
  }
}
