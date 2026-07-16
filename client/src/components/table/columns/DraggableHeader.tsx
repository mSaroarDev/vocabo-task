import { useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  ListTodo,
  Flag,
  AlignLeft,
  UserRoundCheck,
  UserPlus,
  Paperclip,
  CalendarClock,
} from "lucide-react";
import type { ColumnDef } from "../types";
import { cn } from "@/lib/utils";
import { ColumnHeaderDropdown } from "./ColumnHeaderDropdown";

const columnIcons: Record<string, React.ReactNode> = {
  title: <FileText className="size-3.5 flex-shrink-0" />,
  status: <ListTodo className="size-3.5 flex-shrink-0" />,
  priority: <Flag className="size-3.5 flex-shrink-0" />,
  description: <AlignLeft className="size-3.5 flex-shrink-0" />,
  assignee: <UserRoundCheck className="size-3.5 flex-shrink-0" />,
  createdBy: <UserPlus className="size-3.5 flex-shrink-0" />,
  attachments: <Paperclip className="size-3.5 flex-shrink-0" />,
  addedOn: <CalendarClock className="size-3.5 flex-shrink-0" />,
};

export function DraggableHeader({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onRemove,
  onAddColumn,
  onResize,
}: {
  column: ColumnDef;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
  onRemove?: (key: string) => void;
  onAddColumn?: () => void;
  onResize: (key: string, width: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.key}`,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      const th = el.closest("th");
      if (!th) return;
      const startX = e.clientX;
      const startWidth = th.offsetWidth;
      el.setPointerCapture(e.pointerId);

      const onPointerMove = (pe: PointerEvent) => {
        const maxWidth = column.key === "description" ? 300 : 800;
        const newWidth = Math.max(80, Math.min(maxWidth, startWidth + pe.clientX - startX));
        onResize(column.key, newWidth);
      };
      const onPointerUp = () => {
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerUp);
      };
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerUp);
    },
    [column.key, onResize]
  );

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: column.width, minWidth: column.width, maxWidth: column.key === "description" ? 300 : undefined }}
      className={cn(
        "h-10 px-3 text-left text-xs font-bold text-muted-foreground select-none relative border-b border-border/50",
        "hover:text-foreground transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <div
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={() => setMenuOpen(true)}
        {...attributes}
        {...listeners}
      >
        {columnIcons[column.key]}
        <span>{column.label}</span>
        {sortKey === column.key && (
          <span className="text-muted-foreground text-[10px]">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 z-10 touch-none"
        onPointerDown={handleResizeStart}
      />
      {menuOpen && (
        <ColumnHeaderDropdown
          column={column}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={onToggleSort}
          onRename={onRename}
          onRemove={onRemove}
          onAddColumn={onAddColumn}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </th>
  );
}
