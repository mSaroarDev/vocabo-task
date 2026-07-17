import { useState, useMemo } from "react";
import MobileTaskCard from "./MobileTaskCard";
import MobileTaskDetailDrawer from "./mobile-task-detail-drawer";
import type { Task, StatusOption } from "./types";

interface MobileTaskListProps {
  tasks: Task[];
  statusOptions: StatusOption[];
  teamId?: string;
  workspaceId?: string;
  onTaskUpdate?: (id: string, data: Partial<Task>) => void;
}

export default function MobileTaskList({
  tasks,
  statusOptions,
  teamId,
  workspaceId,
  onTaskUpdate,
}: MobileTaskListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  return (
    <div className="flex flex-col gap-3 px-1">
      {tasks.map((task) => (
        <MobileTaskCard
          key={task.id}
          task={task}
          statusOptions={statusOptions}
          onSelect={(t) => setSelectedTaskId(t.id)}
        />
      ))}
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No tasks found</p>
      )}
      <MobileTaskDetailDrawer
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
        onUpdate={onTaskUpdate}
        teamId={teamId}
        workspaceId={workspaceId}
      />
    </div>
  );
}
