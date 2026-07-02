import { useState, useCallback } from "react";
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
import { Plus, GripVertical, ArrowUpDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskDetailSidebar from "./task-detail-sidebar";

type Priority = "High" | "";

interface Person {
  name: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  name: string;
  status: string;
  priority: Priority;
  attachFile: number;
  createdBy: Person;
  assignedTo: Person;
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
    name: "User cannot login with Google OAuth after profile update — returns 401 error",
    status: "In review",
    priority: "High",
    attachFile: 2,
    createdBy: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    assignedTo: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
  },
  {
    id: "2",
    name: "Dashboard chart not rendering on Safari — WebGL compatibility issue",
    status: "Re Open",
    priority: "High",
    attachFile: 1,
    createdBy: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
    assignedTo: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
  },
  {
    id: "3",
    name: "Fix pagination offset when filtering by date range on the invoices page",
    status: "Done",
    priority: "",
    attachFile: 0,
    createdBy: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
    assignedTo: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
  },
  {
    id: "4",
    name: "Email notification delay — sometimes arrives 30+ minutes after trigger",
    status: "Rejected",
    priority: "",
    attachFile: 3,
    createdBy: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
    assignedTo: { name: "Sihab Bin Toriq", initials: "St", color: avatarColors[0] },
  },
  {
    id: "5",
    name: "Mobile nav menu overlaps with page content on iPhone SE",
    status: "In review",
    priority: "High",
    attachFile: 0,
    createdBy: { name: "Muhammad Saroar", initials: "Ms", color: avatarColors[2] },
    assignedTo: { name: "Harun Ar Rashid", initials: "Ha", color: avatarColors[1] },
  },
];

const defaultStatusOptions: StatusOption[] = [
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

const defaultColumns = [
  { key: "name", label: "Task Name", width: 380 },
  { key: "status", label: "Status", width: 120 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "attachFile", label: "Attach File", width: 100 },
  { key: "createdBy", label: "Created By", width: 200 },
  { key: "assignedTo", label: "Assigned To", width: 200 },
];

function ColumnHeaderDropdown({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onClose,
}: {
  column: (typeof defaultColumns)[number];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
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
}: {
  column: (typeof defaultColumns)[number];
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.key}`,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: column.width, minWidth: column.width }}
      className={cn(
        "h-10 px-3 text-left text-xs font-medium text-muted-foreground select-none relative",
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
        <span>{column.label}</span>
        {sortKey === column.key && (
          <span className="text-muted-foreground text-[10px]">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {menuOpen && (
        <ColumnHeaderDropdown
          column={column}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={onToggleSort}
          onRename={onRename}
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
  const currentColor = statusOptions.find((s) => s.label === task.status)?.color || "";

  return (
    <div className="relative">
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer select-none",
          currentColor
        )}
        onClick={() => setOpen(!open)}
      >
        {task.status}
      </span>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[160px]">
            {statusOptions.map((s) => (
              <button
                key={s.label}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                onClick={() => {
                  onUpdate(task.id, s.label);
                  setOpen(false);
                }}
              >
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", s.color)}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function renderCellContent(task: Task, columnKey: string, onSelect: (t: Task) => void, onStatusUpdate: (id: string, status: string) => void, statusOptions: StatusOption[], wrapTaskName?: boolean) {
  switch (columnKey) {
    case "name":
      return (
        <span
          className={cn(
            "cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-accent/50 block text-sm leading-tight",
            wrapTaskName ? "whitespace-normal" : "truncate"
          )}
          onClick={() => onSelect(task)}
        >
          {task.name}
        </span>
      );
    case "status":
      return <StatusCell statusOptions={statusOptions} task={task} onUpdate={onStatusUpdate} />;
    case "priority":
      return task.priority ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600/20 text-red-300">
          {task.priority}
        </span>
      ) : (
        <span className="text-muted-foreground/30">—</span>
      );
    case "attachFile":
      return task.attachFile > 0 ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(task.attachFile, 3) }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-6 rounded bg-zinc-700/50 border border-zinc-600/30 flex items-center justify-center text-[8px] text-muted-foreground overflow-hidden"
            >
              <div className="h-full w-full bg-gradient-to-b from-zinc-600/20 to-zinc-700/40" />
            </div>
          ))}
          {task.attachFile > 3 && (
            <span className="text-[10px] text-muted-foreground ml-0.5">+{task.attachFile - 3}</span>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground/30">—</span>
      );
    case "createdBy":
      return <PersonCell person={task.createdBy} />;
    case "assignedTo":
      return <PersonCell person={task.assignedTo} />;
    default:
      return null;
  }
}

interface DraggableRowProps {
  task: Task;
  isDragging: boolean;
  columnOrder: string[];
  statusOptions: StatusOption[];
  onSelect: (task: Task) => void;
  onStatusUpdate: (id: string, status: string) => void;
  wrapTaskName?: boolean;
}

function DraggableRow({ task, isDragging, columnOrder, statusOptions, onSelect, onStatusUpdate, wrapTaskName }: DraggableRowProps) {
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
        "group border-b border-transparent hover:border-border/30 hover:bg-white/[0.02] transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <td className="h-11 w-8 px-1 text-center">
        <span
          {...attributes}
          {...listeners}
          className="inline-flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors px-1"
        >
          <GripVertical size={14} />
        </span>
      </td>
      {columnOrder.map((key) => (
        <td key={key} className={cn("h-11 px-3", key === "name" && wrapTaskName && "h-auto min-h-11 py-1.5")}>
          {renderCellContent(task, key, onSelect, onStatusUpdate, statusOptions, wrapTaskName)}
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
}

export default function NotionTable({ tasks = sampleTasks, wrapTaskName, statusOptions: externalStatusOptions, onStatusOptionsChange }: NotionTableProps) {
  const [data, setData] = useState<Task[]>(tasks);
  const [localStatusOptions, setLocalStatusOptions] = useState<StatusOption[]>(defaultStatusOptions);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns.map((c) => c.key));
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(
    Object.fromEntries(defaultColumns.map((c) => [c.key, c.label]))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const statusOptions = externalStatusOptions ?? localStatusOptions;
  const setStatusOptions = onStatusOptionsChange ?? setLocalStatusOptions;

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
    } else {
      setData((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === activeIdStr);
        const newIndex = prev.findIndex((t) => t.id === overIdStr);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const sorted = [...data].sort((a, b) => {
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

  const addTask = () => {
    const defaultStatus = statusOptions[0]?.label || "";
    const newTask: Task = {
      id: String(Date.now()),
      name: "Untitled task",
      status: defaultStatus,
      priority: "",
      attachFile: 0,
      createdBy: { name: "You", initials: "Yo", color: avatarColors[0] },
      assignedTo: { name: "Unassigned", initials: "Un", color: avatarColors[1] },
    };
    setData([...data, newTask]);
  };

  const isDragging = (id: string) => activeId === id;

  const sortedColumns = columnOrder.map((key) => {
    const col = defaultColumns.find((c) => c.key === key)!;
    return { ...col, label: columnLabels[key] ?? col.label };
  });

  return (
    <DndContext
      sensors={rowSensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
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
                <tr className="border-b border-border/50">
                  <th style={{ width: 32, minWidth: 32 }} className="h-10" />
                  {sortedColumns.map((col) => (
                    <DraggableHeader
                      key={col.key}
                      column={col}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggleSort={toggleSort}
                      onRename={renameColumn}
                    />
                  ))}
                </tr>
              </SortableContext>
            </DndContext>
          </thead>
          <tbody>
            <SortableContext items={data.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {sorted.map((task) => (
                <DraggableRow
                  key={task.id}
                  task={task}
                  isDragging={isDragging(task.id)}
                  columnOrder={columnOrder}
                  statusOptions={statusOptions}
                  onSelect={(t) => setSelectedTask(t)}
                  onStatusUpdate={(id, status) => setData((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))}
                  wrapTaskName={wrapTaskName}
                />
              ))}
            </SortableContext>
            <tr>
              <td colSpan={columnOrder.length + 1} className="px-3 py-1">
                <button
                  onClick={addTask}
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
                      {data.find((t) => t.id === activeId)?.name}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          )
        ) : null}
      </DragOverlay>
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </DndContext>
  );
}

export type { StatusOption };
