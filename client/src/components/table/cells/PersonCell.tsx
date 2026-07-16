import { useState, useRef } from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import type { TeamMember } from "@/store/slices/teamsSlice";
import type { Person, Task } from "../types";
import { cn } from "@/lib/utils";
import { getAutoMenuPosition } from "../utils";

export function PersonCell({ person, meta }: { person: Person; meta?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
      {person.avatar ? (
        <img src={person.avatar} alt={person.name} className="h-5 w-5 shrink-0 rounded-full object-cover" />
      ) : (
        <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium", person.color)}>
          {person.initials}
        </div>
      )}
      <span className="truncate text-xs text-foreground">{person.name}</span>
      {meta && <span className="shrink-0 text-xs text-muted-foreground">({meta})</span>}
    </div>
  );
}

export function AssigneeCell({
  task,
  members,
  onUpdate,
}: {
  task: Task;
  members?: TeamMember[];
  onUpdate?: (id: string, assignedTo: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pos = getAutoMenuPosition(rect, menuRef.current.offsetHeight);
      setMenuPos(pos);
    }
  }, [open]);

  const isUnassigned = task.assignedTo.name === "Unassigned";

  return (
    <div className="relative inline-flex">
      <div
        ref={triggerRef}
        className={cn(
          "flex items-center gap-2 cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-accent/50 transition-colors",
          isUnassigned && "text-muted-foreground/40"
        )}
        onClick={() => setOpen(!open)}
      >
        {!isUnassigned && (
          task.assignedTo.avatar ? (
            <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium", task.assignedTo.color)}>
              {task.assignedTo.initials}
            </div>
          )
        )}
        <span className="text-xs">{task.assignedTo.name}</span>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {createPortal(
            <div
              ref={menuRef}
              className="fixed z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px] max-h-[240px] overflow-y-auto"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left cursor-pointer",
                  isUnassigned && "bg-white/5"
                )}
                onClick={() => {
                  onUpdate?.(task.id, null);
                  setOpen(false);
                }}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-medium text-foreground">
                  Un
                </div>
                <span className="text-muted-foreground">Unassigned</span>
              </button>
              {members?.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const isSelected = task.assignedTo.name === member.name;
                return (
                  <button
                    key={member.userId}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left cursor-pointer",
                      isSelected && "bg-white/5"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onUpdate?.(task.id, isSelected ? null : member.userId);
                      setOpen(false);
                    }}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-medium">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{member.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {isSelected && <Check size={14} className="text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
