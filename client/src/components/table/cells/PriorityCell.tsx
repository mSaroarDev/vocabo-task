import { useState, useRef } from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { Task, PriorityOption } from "../types";
import { cn } from "@/lib/utils";
import { getAutoMenuPosition } from "../utils";

export function PriorityCell({
  task,
  priorityOptions,
  onUpdate,
}: {
  task: Task;
  priorityOptions: PriorityOption[];
  onUpdate?: (id: string, priority: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = priorityOptions.find((s) => s.label === task.priority);

  useLayoutEffect(() => {
    if (open && triggerRef.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pos = getAutoMenuPosition(rect, menuRef.current.offsetHeight);
      setMenuPos(pos);
    }
  }, [open]);

  return (
    <div className="relative inline-flex">
      <span
        ref={triggerRef}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium cursor-pointer select-none",
          current?.color || "bg-zinc-600/20 text-zinc-300"
        )}
        onClick={() => setOpen(!open)}
      >
        {task.priority}
      </span>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {createPortal(
            <div
              ref={menuRef}
              className="fixed z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Change priority
              </div>
              <div className="border-t border-border/50 mb-1" />
              {priorityOptions.map((p) => (
                <button
                  key={p._id || p.label}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onUpdate?.(task.id, p.label);
                    setOpen(false);
                  }}
                >
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", p.color)}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
