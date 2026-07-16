import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import TaskDetailModal from "./task-detail-modal";
import ImagePreview from "@/components/ui/image-preview";
import type { NotionTableProps, Task } from "./types";
import {
  defaultColumns,
  defaultStatusOptions,
  type ColumnDef,
} from "./types";
import { cn } from "@/lib/utils";
import { DraggableHeader } from "./columns/DraggableHeader";
import { DraggableRow } from "./cells/DraggableRow";

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
  const [localStatusOptions] = useState(defaultStatusOptions);
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
      if (tasks.some((t) => t.id === taskParam)) {
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
    const current = tasks.find((t) => t.id === taskId);
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

  const totalTableWidth = 84 + columnOrder.reduce((sum, key) => sum + (columnWidths[key] || 0), 0);

  const sortedColumns: ColumnDef[] = columnOrder.map((key) => {
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
                  <th style={{ width: 84, minWidth: 84 }} className="h-10" />
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
                    const member = members?.find((m) => m.userId === assignedTo);
                    const optimisticAssignedTo = member
                      ? {
                        name: member.name,
                        initials: member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
                        color: "bg-blue-500/20 text-blue-300",
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
                <td style={{ width: 84, minWidth: 84 }} className="h-9 px-1" />
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
                  <td style={{ width: 84, minWidth: 84 }} className="h-11" />
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
