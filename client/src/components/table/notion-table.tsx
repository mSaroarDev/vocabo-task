import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { Plus, GripVertical, ArrowUpDown, Pencil, Trash2, Circle, Paperclip, FileText, Flag, AlignLeft, User, UserPlus, Check } from "lucide-react";
import type { TeamMember } from "@/store/slices/teamsSlice";
import { cn } from "@/lib/utils";
import TaskDetailModal from "./task-detail-modal";
import ImagePreview from "@/components/ui/image-preview";

type Priority = "Low" | "Medium" | "High" | "Very High" | "Urgent" | "Immediate";

interface Person {
  name: string;
  initials: string;
  color: string;
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
  description?: string;
  banner?: string;
  attachments: Attachment[];
  createdBy: Person;
  assignedTo: Person;
  customFields: Record<string, unknown>;
}

interface StatusOption {
  label: string;
  color: string;
}

const avatarColors = [
  "bg-red-500/20 text-red-300",
  "bg-blue-500/20 text-blue-300",
  "bg-green-500/20 text-green-300",
  "bg-purple-500/20 text-purple-300",
  "bg-amber-500/20 text-amber-300",
  "bg-pink-500/20 text-pink-300",
  "bg-cyan-500/20 text-cyan-300",
];

const sampleTasks: Task[] = [
  {
    id: "1",
    title: "User cannot login with Google OAuth after profile update — returns 401 error",
    status: "In review",
    priority: "Immediate",
    isCompleted: false,
    description: "Users are reporting a 401 error when trying to log in via Google OAuth after updating their profile information. This needs immediate investigation.",
    attachments: [
      { id: "a1", filename: "error-screenshot.png", originalName: "error-screenshot.png", url: "", size: 0, mimeType: "image/png", uploadedBy: "", uploadedAt: "Jun 22, 2026, 12:30 PM" },
    ],
    createdBy: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    assignedTo: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
    customFields: {},
  },
  {
    id: "2",
    title: "Dashboard chart not rendering on Safari — WebGL compatibility issue",
    status: "Re Open",
    priority: "Urgent",
    isCompleted: false,
    attachments: [],
    createdBy: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
    assignedTo: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    customFields: {},
  },
  {
    id: "3",
    title: "Fix pagination offset when filtering by date range on the invoices page",
    status: "Done",
    priority: "Medium",
    isCompleted: true,
    attachments: [],
    createdBy: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
    assignedTo: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
    customFields: {},
  },
  {
    id: "4",
    title: "Email notification delay — sometimes arrives 30+ minutes after trigger",
    status: "Rejected",
    priority: "Low",
    isCompleted: false,
    attachments: [],
    createdBy: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    assignedTo: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    customFields: {},
  },
  {
    id: "5",
    title: "Mobile nav menu overlaps with page content on iPhone SE",
    status: "In review",
    priority: "Very High",
    isCompleted: false,
    attachments: [],
    createdBy: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
    assignedTo: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
    customFields: {},
  },
];

const defaultStatusOptions: StatusOption[] = [
  { label: "New", color: "bg-purple-500/20 text-purple-300" },
  { label: "In review", color: "bg-blue-600/20 text-blue-300" },
  { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
  { label: "Done", color: "bg-green-600/20 text-green-300" },
  { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
];

function PersonCell({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium", person.color)}>
        {person.initials}
      </div>
      <span className="text-sm text-foreground">{person.name}</span>
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
  onUpdate: (id: string, assignedTo: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.left });
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
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium", task.assignedTo.color)}>
            {task.assignedTo.initials}
          </div>
        )}
        <span className="text-sm">{task.assignedTo.name}</span>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {createPortal(
            <div
              className="fixed z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px] max-h-[240px] overflow-y-auto"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left cursor-pointer",
                  isUnassigned && "bg-white/5"
                )}
                onClick={() => {
                  onUpdate(task.id, null);
                  setOpen(false);
                }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-foreground">
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
                    onClick={() => {
                      onUpdate(task.id, member.userId);
                      setOpen(false);
                    }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
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
  title: <FileText className="size-3.5" />,
  status: <Circle className="size-3.5" />,
  priority: <Flag className="size-3.5" />,
  description: <AlignLeft className="size-3.5" />,
  assignee: <User className="size-3.5" />,
  createdBy: <UserPlus className="size-3.5" />,
  attachments: <Paperclip className="size-3.5" />,
};

const defaultColumns = [
  { key: "title", label: "Title", width: 380 },
  { key: "status", label: "Status", width: 120 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "description", label: "Description", width: 200 },
  { key: "assignee", label: "Assigned To", width: 200 },
  { key: "createdBy", label: "Created By", width: 200 },
  { key: "attachments", label: "Attachments", width: 100 },
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
        const newWidth = Math.max(80, Math.min(800, startWidth + pe.clientX - startX));
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
      style={{ ...style, width: column.width, minWidth: column.width }}
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
  const currentColor = statusOptions.find((s) => s.label === task.status)?.color || "";

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  return (
    <div className="relative inline-flex">
      <span
        ref={triggerRef}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium cursor-pointer select-none",
          currentColor
        )}
        onClick={() => setOpen(!open)}
      >
        {task.status}
      </span>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {createPortal(
            <div
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
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", s.color)}>
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
  onUpdate: (id: string, priority: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.left });
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
              className="fixed z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {priorityOptions.map((p) => (
                <button
                  key={p}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onUpdate(task.id, p);
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

const priorityOptions = ["Low", "Medium", "High", "Very High", "Urgent", "Immediate"];

const priorityColors: Record<string, string> = {
  Low: "bg-zinc-600/20 text-zinc-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-red-500/20 text-red-300",
  "Very High": "bg-red-600/30 text-red-200",
  Urgent: "bg-orange-600/30 text-orange-200",
  Immediate: "bg-rose-600/40 text-rose-200",
};

function renderCellContent(task: Task, columnKey: string, onSelect: (t: Task) => void, onStatusUpdate: (id: string, status: string) => void, statusOptions: StatusOption[], wrapTaskName?: boolean, onImagePreview?: (url: string) => void, onPriorityUpdate?: (id: string, priority: string) => void, onAssigneeUpdate?: (id: string, assignedTo: string | null) => void, members?: TeamMember[]) {
  switch (columnKey) {
    case "title":
      return (
        <span className="inline-flex items-center w-full">
          <span
            className={cn(
              "cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-accent/50 text-sm leading-tight",
              wrapTaskName ? "whitespace-normal" : "truncate"
            )}
            onClick={() => onSelect(task)}
          >
            {task.title}
          </span>
        </span>
      );
    case "status":
      return <StatusCell statusOptions={statusOptions} task={task} onUpdate={onStatusUpdate} />;
    case "priority":
      return <PriorityCell task={task} onUpdate={onPriorityUpdate} />;
    case "description":
      return (
        <span className="text-sm text-muted-foreground truncate block">
          {task.description || "—"}
        </span>
      );
    case "createdBy":
      return <PersonCell person={task.createdBy} />;
    case "attachments":
      return task.attachments.length > 0 ? (
        <span className="inline-flex items-center gap-1">
          {task.attachments.slice(0, 3).map((att) =>
            att.mimeType?.startsWith("image/") && att.url ? (
              <img
                key={att.id}
                src={att.url}
                alt={att.originalName}
                className="h-7 w-7 rounded object-cover border border-white/[0.06] cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
                onClick={() => onImagePreview?.(att.url)}
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
        </span>
      ) : (
        <span className="text-muted-foreground/30">—</span>
      );
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
  statusOptions: StatusOption[];
  onSelect: (task: Task) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onPriorityUpdate: (id: string, priority: string) => void;
  onAssigneeUpdate: (id: string, assignedTo: string | null) => void;
  onTaskDelete: (id: string) => void;
  wrapTaskName?: boolean;
  onImagePreview?: (url: string) => void;
  members?: TeamMember[];
}

function DraggableRow({ task, isDragging, columnOrder, statusOptions, onSelect, onStatusUpdate, onPriorityUpdate, onAssigneeUpdate, onTaskDelete, wrapTaskName, onImagePreview, members }: DraggableRowProps) {
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
      <td className="h-9 w-12 px-1 text-center">
        <span
          {...attributes}
          {...listeners}
          className="invisible group-hover:visible inline-flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors px-1"
        >
          <GripVertical size={14} />
        </span>
        <button
          onClick={() => onTaskDelete(task.id)}
          className="invisible group-hover:visible inline-flex cursor-pointer text-muted-foreground/30 hover:text-red-400 transition-colors px-1"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </td>
      {columnOrder.map((key) => (
        <td key={key} className={cn("h-9 px-3 border-b border-border/50", key === "title" && wrapTaskName && "h-auto min-h-9 py-1.5")}>
          {renderCellContent(task, key, onSelect, onStatusUpdate, statusOptions, wrapTaskName, onImagePreview, onPriorityUpdate, onAssigneeUpdate, members)}
        </td>
      ))}
    </tr>
  );
}

interface NotionTableProps {
  tasks?: Task[];
  wrapTaskName?: boolean;
  statusOptions?: StatusOption[];
  onStatusOptionsChange?: (options: StatusOption[]) => void;
  teamId?: string;
  workspaceId?: string;
  members?: TeamMember[];
  onTaskCreate?: (data: Partial<Task>) => Promise<Task | null>;
  onTaskUpdate?: (id: string, data: Partial<Task>) => Promise<Task | null>;
  onTaskDelete?: (id: string) => void;
  onTaskReorder?: (taskIds: string[]) => Promise<{ workspaceId: string; tasks: Task[] } | null>;
  createModalOpen?: boolean;
  onCreateModalChange?: (open: boolean) => void;
}

export default function NotionTable({
  tasks = sampleTasks,
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
}: NotionTableProps) {
  const [localStatusOptions] = useState<StatusOption[]>(defaultStatusOptions);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns.map((c) => c.key));
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(
    Object.fromEntries(defaultColumns.map((c) => [c.key, c.label]))
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    Object.fromEntries(defaultColumns.map((c) => [c.key, c.width]))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const showCreateModal = externalCreateOpen ?? localCreateOpen;
  const setShowCreateModal = onCreateModalChange ?? setLocalCreateOpen;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const statusOptions = externalStatusOptions ?? localStatusOptions;

  const rowSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const colSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
      const orderedTasks = [...tasks];
      const oldIndex = orderedTasks.findIndex((t) => t.id === activeIdStr);
      const newIndex = orderedTasks.findIndex((t) => t.id === overIdStr);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(orderedTasks, oldIndex, newIndex);
      onTaskReorder(reordered.map((t) => t.id));
    }
  }, [tasks, onTaskReorder]);

  const sorted = [...tasks].sort((a, b) => {
    if (!sortKey) return 0;
    const key = sortKey as keyof Task;
    const va = String(a[key] ?? "").toLowerCase();
    const vb = String(b[key] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

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

  const handleTaskUpdate = (id: string, updates: Partial<Task>) => {
    onTaskUpdate?.(id, updates);
  };

  const [creating, setCreating] = useState(false);

  const handleCreateTask = async (partial: Partial<Task>): Promise<Task | null> => {
    if (!onTaskCreate) {
      setShowCreateModal(false);
      return null;
    }
    setCreating(true);
    try {
      const result = await onTaskCreate(partial);
      setShowCreateModal(false);
      return result;
    } catch {
      return null;
    } finally {
      setCreating(false);
    }
  };

  const isDragging = (id: string) => activeId === id;

  const sortedColumns = columnOrder.map((key) => {
    const col = defaultColumns.find((c) => c.key === key)!;
    return { ...col, label: columnLabels[key] ?? col.label, width: columnWidths[key] ?? col.width };
  });

  return (
    <DndContext
      sensors={rowSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">
        <table className="w-full border-collapse text-sm">
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
                  <th style={{ width: 32, minWidth: 32 }} className="h-10" />
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
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {sorted.map((task) => (
                  <DraggableRow
                  key={task.id}
                  task={task}
                  isDragging={isDragging(task.id)}
                  columnOrder={columnOrder}
                  statusOptions={statusOptions}
                  onSelect={(t) => setSelectedTaskId(t.id)}
                  onStatusUpdate={(id, status) => onTaskUpdate?.(id, { status })}
                  onPriorityUpdate={(id, priority) => onTaskUpdate?.(id, { priority: priority as Task["priority"] })}
                  onAssigneeUpdate={(id, assignedTo) => onTaskUpdate?.(id, { assignedTo: assignedTo as unknown as Task["assignedTo"] })}
                  onTaskDelete={(id) => onTaskDelete?.(id)}
                  wrapTaskName={wrapTaskName}
                  onImagePreview={(url) => setPreviewUrl(url)}
                  members={members}
                />
              ))}
            </SortableContext>
            <tr>
              <td colSpan={columnOrder.length + 1} className="pl-8 pr-3 py-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Add task
                </button>
              </td>
            </tr>
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
                  <td className="h-11 w-8" />
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
          onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
          onUpdate={handleTaskUpdate}
          statusOptions={statusOptions}
          mode="view"
          teamId={teamIdProp}
          workspaceId={workspaceIdProp}
        />
      )}
      <TaskDetailModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreateTask}
        statusOptions={statusOptions}
        mode="create"
        loading={creating}
        teamId={teamIdProp}
        workspaceId={workspaceIdProp}
      />
      <ImagePreview
        url={previewUrl || ""}
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </DndContext>
  );
}

export type { StatusOption };
