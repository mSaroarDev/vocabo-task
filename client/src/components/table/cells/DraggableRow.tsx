import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmModal from "@/components/ui/confirm-modal";
import type { TeamMember } from "@/store/slices/teamsSlice";
import type { StatusOption, PriorityOption, Task, CellRenderProps } from "../types";
import { cn } from "@/lib/utils";
import { renderCellContent } from "./renderCellContent";

export interface DraggableRowProps {
  task: Task;
  isDragging: boolean;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  statusOptions: StatusOption[];
  priorityOptions: PriorityOption[];
  isSelected?: boolean;
  onSelect: (task: Task) => void;
  onRowClick?: (task: Task) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onPriorityUpdate: (id: string, priority: string) => void;
  onAssigneeUpdate: (id: string, assignedTo: string | null) => void;
  onTaskDelete: (id: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  wrapTaskName?: boolean;
  onImagePreview?: (urls: string[], index: number) => void;
  members?: TeamMember[];
  editingTaskId?: string | null;
  editingField?: "title" | "description" | null;
  editingValue?: string;
  editingInputRef?: React.RefObject<HTMLInputElement | null>;
  onStartEdit?: (task: Task, field: "title" | "description") => void;
  onEditingChange?: (value: string) => void;
  onSaveEdit?: (taskId: string, value: string) => void;
  onCancelEdit?: () => void;
  teamId?: string;
  workspaceId?: string;
}

export function DraggableRow({
  task,
  isDragging,
  columnOrder,
  columnWidths,
  statusOptions,
  priorityOptions,
  isSelected,
  onSelect,
  onRowClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onTaskDelete,
  selectedIds,
  onToggleSelect,
  wrapTaskName,
  onImagePreview,
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
}: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cellProps: CellRenderProps = {
    onSelect,
    onStatusUpdate,
    statusOptions,
    priorityOptions,
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
  };

  return (
    <>
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => onTaskDelete(task.id)}
      />
      <tr
        ref={setNodeRef}
        style={style}
        className={cn(
          "group transition-colors cursor-pointer",
          isDragging && "opacity-40",
          isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"
        )}
        onClick={() => onRowClick?.(task)}
      >
      <td style={{ width: 84, minWidth: 84 }} className="h-9 px-2 pl-3">
        <div className="flex items-center justify-center flex-nowrap w-full gap-1">
          <Checkbox
            checked={selectedIds?.includes(task.id) ?? false}
            onCheckedChange={() => onToggleSelect?.(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="invisible group-hover:visible data-[state=checked]:visible"
          />
          <span
            {...attributes}
            {...listeners}
            className="invisible group-hover:visible inline-flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors px-0.5"
          >
            <GripVertical size={18} />
          </span>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="invisible group-hover:visible inline-flex cursor-pointer text-muted-foreground/30 hover:text-red-400 transition-colors px-0.5"
            title="Delete task"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
      {columnOrder.map((key, i) => {
        const colW = columnWidths[key];
        return (
          <td key={key} className={cn("h-9 px-3 border-b border-border/50 overflow-hidden", i < columnOrder.length - 1 && "border-r border-border/50", key === "title" && "pl-1", key === "title" && wrapTaskName && "h-auto min-h-9 py-1.5")} style={{ width: colW, minWidth: colW, maxWidth: key === "description" ? colW : undefined }}>
            {renderCellContent(task, key, cellProps)}
          </td>
        );
      })}
      </tr>
    </>
  );
}
