import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, StatusOption } from "@/components/table/notion-table";
import TaskDetailModal from "@/components/table/task-detail-modal";

interface BoardViewProps {
  tasks: Task[];
  statusOptions: StatusOption[];
  onTaskUpdate?: (id: string, data: Partial<Task>, optimisticData?: any) => Promise<Task | null>;
  onTaskCreate?: (data: Partial<Task>, pendingAttachments?: File[]) => void;
  onTaskReorder?: (taskIds: string[], optimisticTasks?: Task[]) => Promise<{ workspaceId: string; tasks: Task[] } | null>;
  teamId?: string;
  workspaceId?: string;
}

const priorityColors: Record<string, string> = {
  None: "bg-zinc-600/20 text-zinc-300",
  Lowest: "bg-blue-500/20 text-blue-300",
  Low: "bg-sky-500/20 text-sky-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-500/20 text-orange-300",
  Highest: "bg-red-500/20 text-red-300",
};

function SortableTaskCard({
  task,
  isDragging,
  onTaskClick,
}: {
  task: Task;
  isDragging: boolean;
  onTaskClick: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = task.banner || task.attachments.find((a) => a.mimeType?.startsWith("image/"))?.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-[#252525] rounded-lg border border-border/50 shadow-sm cursor-grab active:cursor-grabbing",
        isDragging && "opacity-0 pointer-events-none"
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="h-[150px] w-full object-cover rounded-t-lg pointer-events-none"
        />
      )}
      <div className="p-3 pt-3">
        <div
          className="flex items-start gap-2 mb-2"
          onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
        >
          {task.isCompleted ? (
            <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
          ) : (
            <Circle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          )}
          <span className="text-sm text-foreground leading-snug">{task.title}</span>
        </div>
        <div className="flex items-center">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
              priorityColors[task.priority]
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-500/5 h-20" />
  );
}

function BoardColumn({
  status,
  tasks,
  onTaskClick,
  addingNew,
  newTaskTitle,
  newTaskInputRef,
  onNewTitleChange,
  onNewTaskCreate,
  onNewTaskCancel,
  onStartAdd,
  activeId,
  overTaskId,
}: {
  status: StatusOption;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  addingNew: boolean;
  newTaskTitle: string;
  newTaskInputRef: React.RefObject<HTMLInputElement | null>;
  onNewTitleChange: (value: string) => void;
  onNewTaskCreate: () => void;
  onNewTaskCancel: () => void;
  onStartAdd: () => void;
  activeId: string | null;
  overTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.label });
  const isCrossColumn = activeId != null && !tasks.some((t) => t.id === activeId);
  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", status.color.split(" ")[0])} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground/50 ml-auto">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 p-2 rounded-2xl border border-border/30 transition-colors",
          isOver && "bg-white/[0.03] border-blue-500/30"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-2">
              {isCrossColumn && overTaskId === task.id && (
                <Placeholder show />
              )}
              <SortableTaskCard
                task={task}
                isDragging={activeId === task.id}
                onTaskClick={onTaskClick}
              />
            </div>
          ))}
          {activeId && isOver && !overTaskId && isCrossColumn && (
            <Placeholder show />
          )}
        </SortableContext>
        {addingNew && (
          <div className="bg-[#252525] rounded-lg border border-border/50 shadow-sm p-3">
            <input
              ref={newTaskInputRef}
              autoFocus
              value={newTaskTitle}
              onChange={(e) => onNewTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onNewTaskCreate();
                }
                if (e.key === "Escape") {
                  onNewTaskCancel();
                }
              }}
              onBlur={() => {
                if (newTaskTitle.trim()) {
                  onNewTaskCreate();
                } else {
                  onNewTaskCancel();
                }
              }}
              placeholder="Type task title..."
              className="w-full bg-transparent text-sm text-foreground outline-none border-b border-foreground/20 focus:border-foreground/50 px-1 py-0.5 placeholder:text-muted-foreground/30"
            />
          </div>
        )}
        <button
          onClick={onStartAdd}
          className="flex items-center gap-1.5 px-2 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add task
        </button>
      </div>
    </div>
  );
}

function DragOverlayCard({ task }: { task: Task }) {
  const imageUrl = task.banner || task.attachments.find((a) => a.mimeType?.startsWith("image/"))?.url;

  return (
    <div className="bg-[#252525] rounded-lg border border-border/50 shadow-xl w-[300px] rotate-3 opacity-90">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="h-[150px] w-full object-cover rounded-t-lg"
        />
      )}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          {task.isCompleted ? (
            <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
          ) : (
            <Circle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          )}
          <span className="text-sm text-foreground leading-snug">{task.title}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
            priorityColors[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}

export default function BoardView({
  tasks,
  statusOptions,
  onTaskUpdate,
  onTaskCreate,
  onTaskReorder,
  teamId,
  workspaceId,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over && String(over.id) !== String(event.active.id)) {
      setOverTaskId(tasks.find((t) => t.id === String(over.id)) ? String(over.id) : null);
    } else {
      setOverTaskId(null);
    }
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);
    setOverTaskId(null);
    if (!over || active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeIdStr);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === overIdStr);
    const overColumn = statusOptions.find((s) => s.label === overIdStr);

    let targetStatus: string;
    let insertBeforeId: string | null = null;

    if (overTask) {
      targetStatus = overTask.status;
      insertBeforeId = overIdStr;
    } else if (overColumn) {
      targetStatus = overColumn.label;
    } else {
      return;
    }

    const sameColumn = activeTask.status === targetStatus;
    const draggingDown = sameColumn && delta.y > 0;

    const columnTasks = tasks.filter((t) => t.status === targetStatus && t.id !== activeIdStr);
    const updatedTask = { ...activeTask, status: targetStatus } as Task;

    let reorderedColumn: Task[];
    if (insertBeforeId) {
      const insertIdx = columnTasks.findIndex((t) => t.id === insertBeforeId);
      if (insertIdx >= 0) {
        const adjustedIdx = draggingDown ? insertIdx + 1 : insertIdx;
        reorderedColumn = [...columnTasks.slice(0, adjustedIdx), updatedTask, ...columnTasks.slice(adjustedIdx)];
      } else {
        reorderedColumn = [...columnTasks, updatedTask];
      }
    } else {
      reorderedColumn = [...columnTasks, updatedTask];
    }

    const otherTasks = tasks.filter(
      (t) => t.id !== activeIdStr && t.status !== targetStatus
    );
    const finalOrder = [...otherTasks, ...reorderedColumn];

    if (sameColumn) {
      onTaskReorder?.(finalOrder.map((t) => t.id), finalOrder);
    } else {
      onTaskUpdate?.(activeIdStr, { status: targetStatus }, { status: targetStatus });
      onTaskReorder?.(finalOrder.map((t) => t.id), finalOrder);
    }
  };

  const handleCreateTask = () => {
    if (!addingStatus || !newTaskTitle.trim()) return;
    onTaskCreate?.({ title: newTaskTitle.trim(), status: addingStatus });
    setAddingStatus(null);
    setNewTaskTitle("");
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
        {statusOptions.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status.label);
          return (
            <BoardColumn
              key={status.label}
              status={status}
              tasks={columnTasks}
              onTaskClick={(task) => setSelectedTask(task)}
              addingNew={addingStatus === status.label}
              newTaskTitle={newTaskTitle}
              newTaskInputRef={newTaskInputRef}
              onNewTitleChange={setNewTaskTitle}
              onNewTaskCreate={handleCreateTask}
              onNewTaskCancel={() => { setAddingStatus(null); setNewTaskTitle(""); }}
              onStartAdd={() => { setAddingStatus(status.label); setNewTaskTitle(""); }}
              activeId={activeId}
              overTaskId={overTaskId}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && <DragOverlayCard task={activeTask} />}
      </DragOverlay>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          onUpdate={(id, updates) => onTaskUpdate?.(id, updates)}
          statusOptions={statusOptions}
          mode="view"
          teamId={teamId}
          workspaceId={workspaceId}
        />
      )}
    </DndContext>
  );
}
