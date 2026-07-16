import { useState, useRef } from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { StatusOption, Task } from "../types";
import { cn } from "@/lib/utils";
import { getAutoMenuPosition } from "../utils";

export function StatusCell({
  statusOptions,
  task,
  onUpdate,
}: {
  statusOptions: StatusOption[];
  task: Task;
  onUpdate: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentColor = statusOptions.find((s) => s.label === task.status)?.color || "";

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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium cursor-pointer select-none",
          currentColor
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        {task.status}
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
              {statusOptions.map((s) => (
                <button
                  key={s.label}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onUpdate(task.id, s.label);
                    setOpen(false);
                  }}
                >
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", s.color)}>
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    {s.label}
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
