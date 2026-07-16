import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, ArrowUpDown, Pencil, Trash2, Paperclip, FileText, Flag, AlignLeft, UserPlus, Check, Loader2, ImagePlus, ListTodo, UserRoundCheck, CalendarClock } from "lucide-react";
import type { TeamMember } from "@/store/slices/teamsSlice";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import moment from "moment";
import TaskDetailModal from "./task-detail-modal";
import ImagePreview from "@/components/ui/image-preview";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppDispatch } from "@/store/hooks";
import { addTaskAttachment } from "@/store/slices/tasksSlice";
import { CgRatio } from "react-icons/cg";

type Priority = "None" | "Lowest" | "Low" | "Medium" | "High" | "Highest";

interface Person {
  name: string;
  initials: string;
  color: string;
  avatar?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: Priority;
  isCompleted: boolean;
  isArchived?: boolean;
  description?: string;
  banner?: string;
  attachments: Attachment[];
  createdBy: Person;
  assignedTo: Person;
  customFields: Record<string, unknown>;
  workspaceId?: string;
  workspaceName?: string;
  createdAt?: string;
  isPending?: boolean;
}

interface StatusOption {
  label: string;
  color: string;
}

const defaultStatusOptions: StatusOption[] = [
  { label: "New", color: "bg-purple-500/20 text-purple-300" },
  { label: "In progress", color: "bg-sky-500/20 text-sky-300" },
  { label: "In review", color: "bg-blue-600/20 text-blue-300" },
  { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
  { label: "Need info", color: "bg-yellow-500/20 text-yellow-300" },
  { label: "Done", color: "bg-green-600/20 text-green-300" },
  { label: "Duplicate", color: "bg-slate-600/20 text-slate-300" },
  { label: "Invalid", color: "bg-red-600/20 text-red-300" },
  { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
];

function getAutoMenuPosition(
  triggerRect: DOMRect,
  menuHeight: number
): { top: number; left: number } {
  const margin = 6;
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const openUp =
    spaceBelow < menuHeight + margin && triggerRect.top > spaceBelow;
  const top = openUp
    ? triggerRect.top - menuHeight - margin
    : triggerRect.bottom + margin;
  return { top, left: triggerRect.left };
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const then = moment(iso).utcOffset("+06:00");
  const now = moment().utcOffset("+06:00");
  if (then.isSame(now, "day")) return "today";
  const days = now.diff(then, "days");
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = now.diff(then, "weeks");
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"}`;
  const months = now.diff(then, "months");
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = now.diff(then, "years");
  return `${years} year${years === 1 ? "" : "s"}`;
}

function PersonCell({ person, meta }: { person: Person; meta?: string }) {
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

function AssigneeCell({
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

const defaultColumns = [
  { key: "title", label: "Title", width: 350 },
  { key: "status", label: "Status", width: 140 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "description", label: "Description", width: 300 },
  { key: "assignee", label: "Assigned To", width: 200 },
  { key: "createdBy", label: "Created By", width: 200 },
  { key: "attachments", label: "Attachments", width: 100 },
  { key: "addedOn", label: "Added On", width: 100 },
  { key: "workspace", label: "Workspace", width: 160 },
];

function ColumnHeaderDropdown({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onRemove,
  onAddColumn,
  onClose,
}: {
  column: (typeof defaultColumns)[number];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
  onRemove?: (key: string) => void;
  onAddColumn?: () => void;
  onClose: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.label);

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-30 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px]">
        {!renaming ? (
          <>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
              onClick={() => {
                onToggleSort(column.key);
                onClose();
              }}
            >
              <ArrowUpDown size={12} />
              {sortKey === column.key && sortDir === "asc" ? "Sort descending" : "Sort ascending"}
            </button>
            <div className="border-t border-border/50 my-1" />
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
              onClick={() => setRenaming(true)}
            >
              <Pencil size={12} />
              Rename
            </button>
            {onRemove && (
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer text-red-300"
                onClick={() => {
                  onRemove(column.key);
                  onClose();
                }}
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
            {onAddColumn && (
              <>
                <div className="border-t border-border/50 my-1" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onAddColumn();
                    onClose();
                  }}
                >
                  <Plus size={12} />
                  Add column
                </button>
              </>
            )}
          </>
        ) : (
          <div className="px-3 py-2">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim()) onRename(column.key, renameValue.trim());
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameValue.trim()) onRename(column.key, renameValue.trim());
                  onClose();
                }
                if (e.key === "Escape") onClose();
              }}
              className="w-full bg-transparent border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/50"
              placeholder="Column name"
            />
          </div>
        )}
      </div>
    </>
  );
}

function DraggableHeader({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onRemove,
  onAddColumn,
  onResize,
}: {
  column: (typeof defaultColumns)[number];
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

function StatusCell({
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

function PriorityCell({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate?: (id: string, priority: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
          priorityColors[task.priority]
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
              {priorityOptions.map((p) => (
                <button
                  key={p}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onUpdate?.(task.id, p);
                    setOpen(false);
                  }}
                >
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", priorityColors[p])}>
                    {p}
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

const priorityOptions = ["None", "Lowest", "Low", "Medium", "High", "Highest"];

const priorityColors: Record<string, string> = {
  None: "bg-zinc-600/20 text-zinc-300",
  Lowest: "bg-blue-500/20 text-blue-300",
  Low: "bg-sky-500/20 text-sky-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-500/20 text-orange-300",
  Highest: "bg-red-500/20 text-red-300",
};

function AttachmentCell({
  task,
  teamId,
  workspaceId,
  onImagePreview,
}: {
  task: Task;
  teamId?: string;
  workspaceId?: string;
  onImagePreview?: (urls: string[], index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pasteRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (editing && pasteRef.current) {
      pasteRef.current.focus();
    }
  }, [editing]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!teamId || !workspaceId) return;
      setUploading(true);
      try {
        await dispatch(addTaskAttachment({ teamId, workspaceId, taskId: task.id, file })).unwrap();
      } catch {
        // upload failed
      } finally {
        setUploading(false);
        setEditing(false);
      }
    },
    [dispatch, teamId, workspaceId, task.id]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) uploadFile(file);
          return;
        }
      }
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const imageAttachments = task.attachments.filter((a) => a.mimeType.startsWith("image/"));

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {imageAttachments.slice(0, 3).map((att) => (
          <img
            key={att.id}
            src={att.url}
            alt={att.originalName}
            className="h-7 w-7 rounded object-cover border border-white/[0.06]"
          />
        ))}
        <div
          ref={pasteRef}
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onPaste={handlePaste}
          className={cn(
            "flex h-7 items-center gap-1 rounded border border-dashed px-2 text-xs cursor-pointer transition-colors",
            "border-blue-500/50 bg-blue-500/10 text-blue-400"
          )}
        >
          {uploading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <ImagePlus size={10} />
          )}
          <span className="whitespace-nowrap">{uploading ? "Uploading..." : "Paste here"}</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  if (task.attachments.length === 0) {
    return (
      <div className="relative inline-flex items-center">
        <button
          onClick={() => setEditing(true)}
          className="flex h-7 items-center gap-1 rounded border border-dashed border-border/50 px-2 text-xs text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-colors cursor-pointer"
        >
          <ImagePlus size={10} />
          <span>Add</span>
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {task.attachments.slice(0, 3).map((att) =>
        att.mimeType?.startsWith("image/") && att.url ? (
          <img
            key={att.id}
            src={att.url}
            alt={att.originalName}
            className="h-7 w-7 rounded object-cover border border-white/[0.06] cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
            onClick={() =>
              onImagePreview?.(
                imageAttachments.filter((a) => a.url).map((a) => a.url),
                imageAttachments.findIndex((a) => a.id === att.id)
              )
            }
          />
        ) : (
          <span
            key={att.id}
            className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03]"
          >
            <Paperclip size={12} className="text-muted-foreground" />
          </span>
        )
      )}
      {task.attachments.length > 3 && (
        <span className="text-xs text-muted-foreground ml-0.5">
          +{task.attachments.length - 3}
        </span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <ImagePlus size={12} />
      </button>
    </div>
  );
}

function DescriptionEditor({
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

function renderCellContent(task: Task, columnKey: string, onSelect: (t: Task) => void, onStatusUpdate: (id: string, status: string) => void, statusOptions: StatusOption[], wrapTaskName?: boolean, onImagePreview?: (urls: string[], index: number) => void, onPriorityUpdate?: (id: string, priority: string) => void, onAssigneeUpdate?: (id: string, assignedTo: string | null) => void, members?: TeamMember[], editingTaskId?: string | null, editingField?: "title" | "description" | null, editingValue?: string, editingInputRef?: React.RefObject<HTMLInputElement | null>, onStartEdit?: (task: Task, field: "title" | "description") => void, onEditingChange?: (value: string) => void, onSaveEdit?: (taskId: string, value: string) => void, onCancelEdit?: () => void, teamId?: string, workspaceId?: string) {
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
              "cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-accent/50 text-sm leading-tight min-w-0",
              wrapTaskName ? "whitespace-normal" : "truncate"
            )}
            onClick={() => onStartEdit?.(task, "title")}
          >
            {task.title}
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

interface DraggableRowProps {
  task: Task;
  isDragging: boolean;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  statusOptions: StatusOption[];
  onSelect: (task: Task) => void;
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

function DraggableRow({ task, isDragging, columnOrder, columnWidths, statusOptions, onSelect, onStatusUpdate, onPriorityUpdate, onAssigneeUpdate, onTaskDelete, selectedIds, onToggleSelect, wrapTaskName, onImagePreview, members, editingTaskId, editingField, editingValue, editingInputRef, onStartEdit, onEditingChange, onSaveEdit, onCancelEdit, teamId, workspaceId }: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-white/[0.02] transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <td style={{ width: 56, minWidth: 56 }} className="h-9 px-2 pl-6">
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
            className="invisible group-hover:visible inline-flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors px-1"
          >
            <GripVertical size={18} />
          </span>
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: "Delete task?",
                text: `"${task.title}" will be permanently deleted.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Delete",
                cancelButtonText: "Cancel",
                background: "#252525",
                color: "#e5e7eb",
              });
              if (result.isConfirmed) {
                onTaskDelete(task.id);
              }
            }}
            className="invisible group-hover:visible inline-flex cursor-pointer text-muted-foreground/30 hover:text-red-400 transition-colors px-1"
            title="Delete task"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
      {columnOrder.map((key, i) => {
        const colW = columnWidths[key];
        return (
          <td key={key} className={cn("h-9 px-3 pl-5 border-b border-border/50 overflow-hidden", i < columnOrder.length - 1 && "border-r border-border/50", key === "title" && wrapTaskName && "h-auto min-h-9 py-1.5")} style={{ width: colW, minWidth: colW, maxWidth: key === "description" ? colW : undefined }}>
            {renderCellContent(task, key, onSelect, onStatusUpdate, statusOptions, wrapTaskName, onImagePreview, onPriorityUpdate, onAssigneeUpdate, members, editingTaskId, editingField, editingValue, editingInputRef, onStartEdit, onEditingChange, onSaveEdit, onCancelEdit, teamId, workspaceId)}
          </td>
        );
      })}
    </tr>
  );
}

interface NotionTableProps {
  tasks?: Task[];
  isLoading?: boolean;
  wrapTaskName?: boolean;
  statusOptions?: StatusOption[];
  onStatusOptionsChange?: (options: StatusOption[]) => void;
  teamId?: string;
  workspaceId?: string;
  members?: TeamMember[];
  onTaskCreate?: (data: Partial<Task>, pendingAttachments?: File[]) => void;
  onTaskUpdate?: (id: string, data: Partial<Task>, optimisticData?: any) => Promise<Task | null>;
  onTaskDelete?: (id: string) => void;
  onTaskReorder?: (taskIds: string[], optimisticTasks?: Task[]) => Promise<{ workspaceId: string; tasks: Task[] } | null>;
  createModalOpen?: boolean;
  onCreateModalChange?: (open: boolean) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  hideAssignee?: boolean;
  hideCreatedBy?: boolean;
  showWorkspace?: boolean;
  hideAddTask?: boolean;
}

export default function NotionTable({
  tasks = [],
  isLoading,
  wrapTaskName,
  statusOptions: externalStatusOptions,
  teamId: teamIdProp,
  workspaceId: workspaceIdProp,
  members,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskReorder,
  createModalOpen: externalCreateOpen,
  onCreateModalChange,
  selectedIds,
  onToggleSelect,
  hideAssignee,
  hideCreatedBy,
  showWorkspace,
  hideAddTask,
}: NotionTableProps) {
  const baseColumns = defaultColumns.filter((c) => {
    if (c.key === "workspace") return false;
    if (hideAssignee && c.key === "assignee") return false;
    if (hideCreatedBy && c.key === "createdBy") return false;
    return true;
  });
  const workspaceColumn = defaultColumns.find((c) => c.key === "workspace")!;
  const visibleColumns = showWorkspace
    ? [...baseColumns, workspaceColumn]
    : baseColumns;
  const [localStatusOptions] = useState<StatusOption[]>(defaultStatusOptions);
  const [columnOrder, setColumnOrder] = useState<string[]>(visibleColumns.map((c) => c.key));
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(
    Object.fromEntries(visibleColumns.map((c) => [c.key, c.label]))
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    Object.fromEntries(visibleColumns.map((c) => [c.key, c.width]))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  const [addingNew, setAddingNew] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"title" | "description" | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editingInputRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const taskParam = searchParams.get("task");
    if (taskParam) {
      if (tasks.some(t => t.id === taskParam)) {
        setSelectedTaskId(taskParam);
      }
    }
  }, [searchParams, tasks]);

  const statusOptions = externalStatusOptions ?? localStatusOptions;

  const rowSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const colSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = useMemo(() => [...tasks].sort((a, b) => {
    if (!sortKey) return 0;
    const key = sortKey as keyof Task;
    const va = String(a[key] ?? "").toLowerCase();
    const vb = String(b[key] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  }), [tasks, sortKey, sortDir]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr.startsWith("col-")) {
      setColumnOrder((prev) => {
        const oldIndex = prev.findIndex((k) => `col-${k}` === activeIdStr);
        const newIndex = prev.findIndex((k) => `col-${k}` === overIdStr);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    } else if (onTaskReorder) {
      const orderedTasks = [...sorted];
      const oldIndex = orderedTasks.findIndex((t) => t.id === activeIdStr);
      const newIndex = orderedTasks.findIndex((t) => t.id === overIdStr);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(orderedTasks, oldIndex, newIndex);
      onTaskReorder(reordered.map((t) => t.id), reordered);
    }
  }, [sorted, onTaskReorder]);

  useEffect(() => {
    if (externalCreateOpen) {
      setAddingNew(true);
      onCreateModalChange?.(false);
    }
  }, [externalCreateOpen, onCreateModalChange]);



  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const renameColumn = (key: string, newLabel: string) => {
    setColumnLabels((prev) => ({ ...prev, [key]: newLabel }));
  };

  const handleTaskUpdate = (id: string, updates: Partial<Task>, optimisticData?: any) => {
    onTaskUpdate?.(id, updates, optimisticData);
  };

  const handleStartEdit = useCallback((task: Task, field: "title" | "description") => {
    setEditingTaskId(task.id);
    setEditingField(field);
    setEditingValue(field === "title" ? task.title : (task.description || ""));
  }, []);

  const handleSaveEdit = useCallback((taskId: string, value: string) => {
    if (!editingField) return;
    const current = tasks.find(t => t.id === taskId);
    if (value.trim() && value.trim() !== (current?.[editingField] || "")) {
      onTaskUpdate?.(taskId, { [editingField]: value.trim() } as Partial<Task>);
    }
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue("");
  }, [onTaskUpdate, tasks, editingField]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue("");
  }, []);

  const isDragging = (id: string) => activeId === id;

  const totalTableWidth = 56 + columnOrder.reduce((sum, key) => sum + (columnWidths[key] || 0), 0);

  const sortedColumns = columnOrder.map((key) => {
    const col = defaultColumns.find((c) => c.key === key)!;
    return { ...col, label: columnLabels[key] ?? col.label, width: columnWidths[key] ?? col.width };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={rowSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden pl-1">
        <table className="border-collapse text-sm table-fixed text-left" style={{ width: totalTableWidth, minWidth: '100%' }}>
          <thead>
            <DndContext
              sensors={colSensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder.map((k) => `col-${k}`)}
                strategy={horizontalListSortingStrategy}
              >
                <tr>
                  <th style={{ width: 56, minWidth: 56 }} className="h-10" />
                  {sortedColumns.map((col) => (
                    <DraggableHeader
                      key={col.key}
                      column={col}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggleSort={toggleSort}
                      onRename={renameColumn}
                      onResize={(key, w) =>
                        setColumnWidths((prev) => ({ ...prev, [key]: w }))
                      }
                    />
                  ))}
                </tr>
              </SortableContext>
            </DndContext>
          </thead>
          <tbody>
            <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {sorted.map((task) => (
                <DraggableRow
                  columnWidths={columnWidths}
                  key={task.id}
                  task={task}
                  isDragging={isDragging(task.id)}
                  columnOrder={columnOrder}
                  statusOptions={statusOptions}
                  onSelect={(t) => {
                    setSelectedTaskId(t.id);
                    setSearchParams(prev => { prev.set("task", t.id); return prev; }, { replace: true });
                  }}
                  onStatusUpdate={(id, status) => onTaskUpdate?.(id, { status })}
                  onPriorityUpdate={(id, priority) => onTaskUpdate?.(id, { priority: priority as Task["priority"] })}
                  onAssigneeUpdate={(id, assignedTo) => {
                    const member = members?.find(m => m.userId === assignedTo);
                    const optimisticAssignedTo = member
                      ? {
                        name: member.name,
                        initials: member.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
                        color: "bg-blue-500/20 text-blue-300"
                      }
                      : { name: "Unassigned", initials: "Un", color: "bg-blue-500/20 text-blue-300" };
                    onTaskUpdate?.(id, { assignedTo: assignedTo as unknown as Task["assignedTo"] }, { assignedTo: optimisticAssignedTo });
                  }}
                  onTaskDelete={(id) => onTaskDelete?.(id)}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  wrapTaskName={wrapTaskName}
                  onImagePreview={(urls, index) => {
                    setPreviewUrls(urls);
                    setPreviewIndex(index);
                  }}
                  members={members}
                  editingTaskId={editingTaskId}
                  editingField={editingField}
                  editingValue={editingValue}
                  editingInputRef={editingInputRef}
                  onStartEdit={handleStartEdit}
                  onEditingChange={setEditingValue}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  teamId={teamIdProp}
                  workspaceId={workspaceIdProp}
                />
              ))}
            </SortableContext>
            {addingNew && (
              <tr className="group">
                <td style={{ width: 56, minWidth: 56 }} className="h-9 px-1" />
                {columnOrder.map((key, i) => (
                  <td key={key} className={cn("h-9 px-3 border-b border-border/50", i < columnOrder.length - 1 && "border-r border-border/50")} style={{ width: columnWidths[key], minWidth: columnWidths[key] }}>
                    {key === "title" ? (
                      <input
                        ref={newTaskInputRef}
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newTaskTitle.trim()) {
                              onTaskCreate?.({ title: newTaskTitle.trim() });
                            }
                            setNewTaskTitle("");
                            setAddingNew(false);
                          }
                          if (e.key === "Escape") {
                            setNewTaskTitle("");
                            setAddingNew(false);
                          }
                        }}
                        onBlur={() => {
                          if (newTaskTitle.trim()) {
                            onTaskCreate?.({ title: newTaskTitle.trim() });
                          }
                          setNewTaskTitle("");
                          setAddingNew(false);
                        }}
                        placeholder="Type task title..."
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/30"
                      />
                    ) : (
                      <span className="text-muted-foreground/30 text-sm">—</span>
                    )}
                  </td>
                ))}
              </tr>
            )}
            {!hideAddTask && (
              <tr>
                <td colSpan={columnOrder.length + 1} className="pl-16 pr-3 py-1">
                  <button
                    onClick={() => setAddingNew(true)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    Add task
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DragOverlay>
        {activeId ? (
          activeId.startsWith("col-") ? (
            <div className="h-10 px-3 flex items-center text-xs font-medium text-muted-foreground bg-[#1e1e1e] border border-border/50 shadow-xl rounded opacity-90">
              {sortedColumns.find((_, i) => `col-${columnOrder[i]}` === activeId)?.label}
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="bg-[#1e1e1e] border border-border/50 shadow-xl rounded-lg opacity-90">
                  <td style={{ width: 56, minWidth: 56 }} className="h-11" />
                  <td className="h-11 px-3" colSpan={columnOrder.length}>
                    <span className="text-sm leading-tight">
                      {tasks.find((t) => t.id === activeId)?.title}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )
        ) : null}
      </DragOverlay>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTaskId(null);
              setSearchParams(prev => { prev.delete("task"); return prev; }, { replace: true });
            }
          }}
          onUpdate={handleTaskUpdate}
          statusOptions={statusOptions}
          mode="view"
          teamId={teamIdProp}
          workspaceId={workspaceIdProp}
        />
      )}
      <ImagePreview
        urls={previewUrls}
        index={previewIndex}
        open={previewUrls.length > 0}
        onClose={() => setPreviewUrls([])}
        onIndexChange={setPreviewIndex}
      />
    </DndContext>
  );
}

export type { StatusOption };
