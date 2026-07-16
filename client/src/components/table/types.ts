import type { TeamMember } from "@/store/slices/teamsSlice";

export type Priority = "None" | "Lowest" | "Low" | "Medium" | "High" | "Highest";

export interface Person {
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

export interface StatusOption {
  label: string;
  color: string;
}

export const defaultStatusOptions: StatusOption[] = [
  { label: "New", color: "bg-purple-500/20 text-purple-300" },
  { label: "In progress", color: "bg-sky-500/20 text-sky-300" },
  { label: "In review", color: "bg-blue-600/20 text-blue-300" },
  { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
  { label: "Need info", color: "bg-yellow-500/20 text-yellow-300" },
  { label: "Done", color: "bg-green-600/20 text-green-300" },
  { label: "Duplicate", color: "bg-slate-600/20 text-slate-300" },
  { label: "Invalid", color: "bg-red-600/20 text-red-300" },
  { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
  { label: "PR Created", color: "bg-pink-500/20 text-pink-300" },
  { label: "Need Approval", color: "bg-cyan-500/20 text-cyan-300" },
  { label: "PR Raised", color: "bg-rose-500/20 text-rose-300" },
  { label: "Ready for Test", color: "bg-emerald-500/20 text-emerald-300" },
  { label: "Need Approval", color: "bg-violet-500/20 text-violet-300" },
];

export const priorityOptions = [
  "None",
  "Lowest",
  "Low",
  "Medium",
  "High",
  "Highest",
] as const;

export const priorityColors: Record<string, string> = {
  None: "bg-zinc-600/20 text-zinc-300",
  Lowest: "bg-blue-500/20 text-blue-300",
  Low: "bg-sky-500/20 text-sky-300",
  Medium: "bg-amber-500/20 text-amber-300",
  High: "bg-orange-500/20 text-orange-300",
  Highest: "bg-red-500/20 text-red-300",
};

export interface ColumnDef {
  key: string;
  label: string;
  width: number;
}

export const defaultColumns: ColumnDef[] = [
  { key: "title", label: "Title", width: 350 },
  { key: "status", label: "Status", width: 160 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "description", label: "Description", width: 300 },
  { key: "assignee", label: "Assigned To", width: 200 },
  { key: "createdBy", label: "Created By", width: 200 },
  { key: "attachments", label: "Attachments", width: 100 },
  { key: "addedOn", label: "Added On", width: 110 },
  { key: "workspace", label: "Workspace", width: 160 },
];

export interface ColumnConfig extends ColumnDef {
  label: string;
  width: number;
}

export interface CellEditHandlers {
  onStartEdit?: (task: Task, field: "title" | "description") => void;
  onEditingChange?: (value: string) => void;
  onSaveEdit?: (taskId: string, value: string) => void;
  onCancelEdit?: () => void;
}

export interface CellRenderProps extends CellEditHandlers {
  onSelect: (t: Task) => void;
  onStatusUpdate: (id: string, status: string) => void;
  statusOptions: StatusOption[];
  wrapTaskName?: boolean;
  onImagePreview?: (urls: string[], index: number) => void;
  onPriorityUpdate?: (id: string, priority: string) => void;
  onAssigneeUpdate?: (id: string, assignedTo: string | null) => void;
  members?: TeamMember[];
  editingTaskId?: string | null;
  editingField?: "title" | "description" | null;
  editingValue?: string;
  editingInputRef?: React.RefObject<HTMLInputElement | null>;
  teamId?: string;
  workspaceId?: string;
}

export interface NotionTableProps {
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
