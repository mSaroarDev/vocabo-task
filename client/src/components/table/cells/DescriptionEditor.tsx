import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Task } from "../types";

export function DescriptionEditor({
  task,
  isEditing,
  editingValue,
  onStartEdit,
  onEditingChange,
  onSaveEdit,
  onCancelEdit,
}: {
  task: Task;
  isEditing: boolean;
  editingValue?: string;
  onStartEdit?: (task: Task, field: "title" | "description") => void;
  onEditingChange?: (value: string) => void;
  onSaveEdit?: (taskId: string, value: string) => void;
  onCancelEdit?: () => void;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (isEditing && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: Math.max(rect.width, 300) });
    } else {
      setPos(null);
    }
  }, [isEditing, editingValue]);

  return (
    <>
      <span
        ref={spanRef}
        className="text-sm text-muted-foreground block cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-accent/50 truncate"
        title={task.description}
        onClick={() => onStartEdit?.(task, "description")}
      >
        {task.description || "—"}
      </span>
      {isEditing && pos &&
        createPortal(
          <textarea
            autoFocus
            value={editingValue}
            onChange={(e) => onEditingChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit?.();
              }
            }}
            onBlur={() => onSaveEdit?.(task.id, editingValue || "")}
            rows={Math.min(8, Math.max(2, (editingValue || "").split("\n").length))}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            className="z-50 bg-[#252525] text-sm text-foreground outline-none border border-blue-500/50 focus:border-blue-500 rounded px-2 py-1 resize-none leading-tight shadow-xl"
          />,
          document.body
        )}
    </>
  );
}
