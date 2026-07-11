import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Check,
  Plus,
  GripVertical,
  ListTodo,
  Star,
  Trash2,
  Pen,
  LogOut,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ItemModal from "@/components/ui/item-modal";
import WorkspaceModal from "@/components/ui/workspace-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useChecklist } from "@/hooks/useChecklist";
import { WorkspaceIcon } from "@/lib/workspace-icons";

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  iconName?: string;
  active?: boolean;
}

const favorites: SidebarItem[] = [
  { id: "1", label: "Getting Started", icon: <Star size={16} />, active: true },
  // { id: "2", label: "Meeting Notes", icon: <Star size={16} /> },
  // { id: "3", label: "Project Ideas", icon: <Star size={16} /> },
];

interface SidebarSectionProps {
  title: string;
  items: SidebarItem[];
  emptyMessage?: string;
  statusMessage?: string;
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string, currentLabel: string) => void;
  onDelete?: (id: string) => void;
  onItemClick?: (id: string) => void;
  onReorder?: (items: SidebarItem[]) => void;
  addLabel?: string;
}

interface SidebarSectionItemProps {
  item: SidebarItem;
  sortable?: boolean;
  onEdit?: (id: string, currentLabel: string) => void;
  onDelete?: (id: string) => void;
  onItemClick?: (id: string) => void;
}

function SidebarSectionItem({
  item,
  sortable = false,
  onEdit,
  onDelete,
  onItemClick,
}: SidebarSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !sortable });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative w-full rounded-sm text-sm font-normal text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        item.active && "bg-sidebar-accent text-sidebar-accent-foreground",
        isDragging && "z-30 opacity-70"
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full min-w-0 items-center gap-3 px-3 py-1.5 text-left",
          onItemClick ? "cursor-pointer" : "cursor-default"
        )}
        onClick={() => onItemClick?.(item.id)}
      >
        {sortable && (
          <span
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${item.label}`}
            className="flex h-4 w-3 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 active:cursor-grabbing"
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical size={12} />
          </span>
        )}
        {item.icon}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </button>
      {(onEdit || onDelete) && (
        <div className="pointer-events-none absolute right-1 top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-sm bg-sidebar-accent px-0.5 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          {onEdit && (
            <button
              type="button"
              title="Edit"
              aria-label={`Edit ${item.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id, item.label);
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-sidebar-border hover:text-sidebar-foreground"
            >
              <Pen size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="Delete"
              aria-label={`Delete ${item.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-sidebar-border hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarSection({
  title,
  items,
  emptyMessage,
  statusMessage,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onItemClick,
  onReorder,
  addLabel,
}: SidebarSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  const sortable = Boolean(onReorder);

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex cursor-pointer items-center gap-1 px-3 py-1 text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground w-full"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        {title}
      </button>
      {!collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          ) : statusMessage ? (
            <p className="px-3 py-1 text-xs text-muted-foreground">
              {statusMessage}
            </p>
          ) : null}
          {!statusMessage && !isLoading && items.length === 0 && emptyMessage && (
            <p className="px-3 py-1 text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          )}
          {sortable ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SidebarSectionItem
                    key={item.id}
                    item={item}
                    sortable
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onItemClick={onItemClick}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            items.map((item) => (
              <SidebarSectionItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onItemClick={onItemClick}
              />
            ))
              )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-sidebar-foreground"
            >
              <Plus size={14} />
              {addLabel || "Add"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { teams, selectedTeam, setSelectedTeam, addTeam } = useTeams();
  const {
    workspaces,
    isLoading: workspacesLoading,
    error: workspacesError,
    addWorkspace: addWs,
    updateWorkspace: updateWs,
    removeWorkspace: removeWs,
    reorderWorkspaces: reorderWs,
  } = useWorkspaces(selectedTeam?.id);
  const {
    groups: checklistGroups,
    createGroup,
    renameGroup: renameChecklist,
    deleteGroup: deleteChecklist,
    reorderGroups,
  } = useChecklist();
  const [searchParams] = useSearchParams();
  const activeWorkspace = searchParams.get("workspace");
  const activeChecklist = searchParams.get("checklist");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  const workspaceList: SidebarItem[] = workspaces
    .filter((workspace) => workspace.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .map((w) => ({
      id: w.id,
      label: w.name,
      icon: <WorkspaceIcon name={w.icon} size={16} />,
      iconName: w.icon,
    }));
  const canReorderWorkspaces = Boolean(selectedTeam && !searchQuery.trim());

  // Modal state
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    title: string;
    initialValue: string;
    onSave: (value: string) => void;
  }>({ open: false, title: "", initialValue: "", onSave: () => {} });
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);

  // Confirm state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const openInputModal = (title: string, initialValue: string, onSave: (value: string) => void) => {
    setItemModal({ open: true, title, initialValue, onSave });
  };

  const openConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const createTeam = () => {
    setTeamDropdownOpen(false);
    openInputModal("Create team", "", (value) => {
      void addTeam(value);
    });
  };

  const addWorkspace = () => {
    if (!selectedTeam) return;

    setEditingWorkspace(null);
    setWorkspaceModalOpen(true);
  };

  const editWorkspace = (_id: string) => {
    if (!selectedTeam) return;

    const workspace = workspaces.find((item) => item.id === _id);
    if (!workspace) return;

    setEditingWorkspace({
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
    });
    setWorkspaceModalOpen(true);
  };

  const deleteWorkspace = (id: string) => {
    if (!selectedTeam) return;

    openConfirm("Delete workspace", "Are you sure you want to delete this workspace?", () => {
      void removeWs(id).then(() => {
        if (activeWorkspace === id) {
          navigate("/dashboard");
        }
      }).catch(() => {
        // Redux stores and renders the API error.
      });
    });
  };

  const addChecklist = () => {
    openInputModal("Add list", "", (value) => {
      createGroup(value);
    });
  };

  const editChecklist = (id: string, currentLabel: string) => {
    openInputModal("Rename list", currentLabel, (value) => {
      renameChecklist(id, value);
    });
  };

  const handleDeleteChecklist = (id: string) => {
    openConfirm("Delete list", "Are you sure you want to delete this list?", () => {
      deleteChecklist(id);
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userInitials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      <ItemModal
        open={itemModal.open}
        onOpenChange={(open) => setItemModal((prev) => ({ ...prev, open }))}
        title={itemModal.title}
        initialValue={itemModal.initialValue}
        onSave={itemModal.onSave}
      />
      <WorkspaceModal
        open={workspaceModalOpen}
        onOpenChange={(open) => {
          setWorkspaceModalOpen(open);
          if (!open) setEditingWorkspace(null);
        }}
        title={editingWorkspace ? "Edit workspace" : "Add workspace"}
        initialName={editingWorkspace?.name || ""}
        initialIcon={editingWorkspace?.icon || "briefcase"}
        onSave={({ name, icon }) => {
          if (editingWorkspace) {
            void updateWs(editingWorkspace.id, name, icon).then((workspace) => {
              if (workspace && activeWorkspace === editingWorkspace.id) {
                navigate(`/dashboard?workspace=${workspace.id}`, { replace: true });
              }
            }).catch(() => {
              // Redux stores and renders the API error.
            });
            return;
          }

          void addWs(name, icon).catch(() => {
            // Redux stores and renders the API error.
          });
        }}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />

      <aside className="h-full w-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
        {/* Team switcher */}
        <div className="relative px-3 pt-2 pb-1">
          <button
            onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white",
                selectedTeam ? selectedTeam.color : "bg-sidebar-accent"
              )}
            >
              {selectedTeam?.avatar || "+"}
            </div>
            <span className="flex-1 truncate text-left">
              {selectedTeam?.name || "No team"}
            </span>
            <ChevronsUpDown size={14} className="text-muted-foreground" />
          </button>

          {teamDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTeamDropdownOpen(false)} />
              <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-sidebar-border bg-sidebar py-1 shadow-lg">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(team);
                      setTeamDropdownOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white ${team.color}`}>
                      {team.avatar}
                    </div>
                    <span className="flex-1 truncate text-left">{team.name}</span>
                    {selectedTeam?.id === team.id && <Check size={14} className="text-muted-foreground" />}
                  </button>
                ))}
                <button
                  onClick={createTeam}
                  className="mt-1 flex w-full cursor-pointer items-center gap-3 border-t border-sidebar-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-accent text-sidebar-foreground">
                    <Plus size={14} />
                  </div>
                  <span className="flex-1 truncate text-left">Create team</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="p-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-sidebar-accent/50 border-sidebar-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <SidebarSection
            title="Favorites"
            items={favorites}
            onItemClick={() => {
              navigate("/dashboard");
            }}
          />

          <SidebarSection
            title="Workspaces"
            items={workspaceList.map((w) => ({ ...w, active: w.id === activeWorkspace }))}
            emptyMessage={selectedTeam ? "No workspaces yet" : "Create or select a team first"}
            isLoading={workspacesLoading}
            statusMessage={workspacesError || undefined}
            onAdd={selectedTeam ? addWorkspace : undefined}
            onEdit={editWorkspace}
            onDelete={deleteWorkspace}
            onReorder={
              canReorderWorkspaces
                ? (orderedItems) => {
                    void reorderWs(orderedItems.map((item) => item.id)).catch(() => {
                      // Redux stores and renders the API error.
                    });
                  }
                : undefined
            }
            onItemClick={(id) => {
              const ws = workspaceList.find((w) => w.id === id);
              if (ws) navigate(`/dashboard?workspace=${ws.id}`);
            }}
            addLabel="Add workspace"
          />

          <SidebarSection
            title="Personal Checklist"
            items={checklistGroups.map((g) => ({
              id: g.id,
              label: g.title,
              icon: <ListTodo size={16} />,
              active: g.id === activeChecklist,
            }))}
            onAdd={addChecklist}
            onEdit={editChecklist}
            onDelete={handleDeleteChecklist}
            onReorder={(orderedItems) => {
              reorderGroups(orderedItems.map((item) => item.id));
            }}
            onItemClick={(id) => {
              navigate(`/dashboard?checklist=${id}`);
            }}
            addLabel="Add list"
          />
        </ScrollArea>

        <div className="pb-3">
          <div
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 px-3 py-2 rounded-md mx-2 mt-2 group cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Log out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-border hover:text-foreground group-hover:opacity-100 cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
