import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Check,
  Plus,
  Briefcase,
  ListTodo,
  Star,
  Trash2,
  Pen,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ItemModal from "@/components/ui/item-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

const favorites: SidebarItem[] = [
  { id: "1", label: "Getting Started", icon: <Star size={16} />, active: true },
  { id: "2", label: "Meeting Notes", icon: <Star size={16} /> },
  { id: "3", label: "Project Ideas", icon: <Star size={16} /> },
];

interface SidebarSectionProps {
  title: string;
  items: SidebarItem[];
  onAdd?: () => void;
  onEdit?: (id: string, currentLabel: string) => void;
  onDelete?: (id: string) => void;
  onItemClick?: (id: string) => void;
  addLabel?: string;
}

function SidebarSection({ title, items, onAdd, onEdit, onDelete, onItemClick, addLabel }: SidebarSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

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
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <Button
                variant="sidebar"
                className={cn(onItemClick && "cursor-pointer", item.active && "bg-sidebar-accent text-sidebar-accent-foreground")}
                onClick={() => onItemClick?.(item.id)}
              >
                {item.icon}
                <span className="flex-1 truncate text-left">{item.label}</span>
                <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {onEdit && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onEdit(item.id, item.label); }}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-sidebar-border"
                    >
                      <Pen size={10} />
                    </span>
                  )}
                  {onDelete && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded hover:bg-sidebar-border"
                    >
                      <Trash2 size={10} />
                    </span>
                  )}
                </span>
              </Button>
            </div>
          ))}
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

let nextId = 13;

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { teams, selectedTeam, setSelectedTeam } = useTeams();
  const { workspaces, addWorkspace: addWs, updateWorkspace: updateWs, removeWorkspace: removeWs } = useWorkspaces();
  const [searchParams] = useSearchParams();
  const activeWorkspace = searchParams.get("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [checklistList, setChecklistList] = useState<SidebarItem[]>([
    { id: "10", label: "Daily Tasks", icon: <ListTodo size={16} /> },
    { id: "11", label: "Shopping List", icon: <ListTodo size={16} /> },
    { id: "12", label: "Goals", icon: <ListTodo size={16} /> },
  ]);

  const workspaceList: SidebarItem[] = workspaces.map((w) => ({
    id: w.id,
    label: w.name,
    icon: <Briefcase size={16} />,
  }));

  // Modal state
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    title: string;
    initialValue: string;
    onSave: (value: string) => void;
  }>({ open: false, title: "", initialValue: "", onSave: () => {} });

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

  const addWorkspace = () => {
    openInputModal("Add workspace", "", (value) => {
      addWs(value);
    });
  };

  const editWorkspace = (_id: string, currentLabel: string) => {
    openInputModal("Rename workspace", currentLabel, (value) => {
      updateWs(_id, value);
    });
  };

  const deleteWorkspace = (id: string) => {
    openConfirm("Delete workspace", "Are you sure you want to delete this workspace?", () => {
      removeWs(id);
    });
  };

  const addChecklist = () => {
    openInputModal("Add list", "", (value) => {
      const id = String(nextId++);
      setChecklistList([...checklistList, { id, label: value, icon: <ListTodo size={16} /> }]);
    });
  };

  const editChecklist = (_id: string, currentLabel: string) => {
    openInputModal("Rename list", currentLabel, (value) => {
      setChecklistList(checklistList.map((c) => (c.id === _id ? { ...c, label: value } : c)));
    });
  };

  const deleteChecklist = (id: string) => {
    openConfirm("Delete list", "Are you sure you want to delete this list?", () => {
      setChecklistList(checklistList.filter((c) => c.id !== id));
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
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />

      <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        {/* Team switcher */}
        <div className="relative px-3 pt-2 pb-1">
          <button
            onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white ${selectedTeam.color}`}>
              {selectedTeam.avatar}
            </div>
            <span className="flex-1 truncate text-left">{selectedTeam.name}</span>
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
                    {selectedTeam.id === team.id && <Check size={14} className="text-muted-foreground" />}
                  </button>
                ))}
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
          <SidebarSection title="Favorites" items={favorites} />

          <SidebarSection
            title="Workspaces"
            items={workspaceList.map((w) => ({ ...w, active: w.id === activeWorkspace }))}
            onAdd={addWorkspace}
            onEdit={editWorkspace}
            onDelete={deleteWorkspace}
            onItemClick={(id) => {
              const ws = workspaceList.find((w) => w.id === id);
              if (ws) navigate(`/dashboard?workspace=${ws.id}&name=${encodeURIComponent(ws.label)}`);
            }}
            addLabel="Add workspace"
          />

          <SidebarSection
            title="Personal Checklist"
            items={checklistList}
            onAdd={addChecklist}
            onEdit={editChecklist}
            onDelete={deleteChecklist}
            addLabel="Add list"
          />
        </ScrollArea>

        <div className="pb-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md mx-2 mt-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
            <button
              onClick={handleLogout}
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
