import BoardView from "@/components/board/board-view";
import ChecklistView from "@/components/checklist/checklist-view";
import NotionTable, { type StatusOption } from "@/components/table/notion-table";
import MobileTaskList from "@/components/table/MobileTaskList";
import SettingsModal from "@/components/table/settings-modal";
import WorkspaceModal from "@/components/ui/workspace-modal";
import { useAuth } from "@/hooks/useAuth";
import { useAssignedTasks } from "@/hooks/useAssignedTasks";
import { useChecklist } from "@/hooks/useChecklist";
import { useTasks } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { cn } from "@/lib/utils";
import { WorkspaceIcon } from "@/lib/workspace-icons";
import { ClipboardList, Clock, Filter, LayoutDashboard, Plus, Search, Sun, UserPlus, Users, Check, X, Archive } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ChecklistGroup } from "@/hooks/useChecklist";
import type { Workspace } from "@/store/slices/workspacesSlice";
import { isMobile } from "@/lib/device";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { teams, selectedTeam, addTeam, joinTeam, isLoading: teamsLoading, error: teamsError } = useTeams();
  const workspaceId = searchParams.get("workspace");
  const checklistId = searchParams.get("checklist");
  const onMobile = isMobile();
  const { workspaces, updateWorkspace, addWorkspace } = useWorkspaces(selectedTeam?.id);
  const effectiveWorkspaceId = workspaceId ?? (onMobile ? workspaces[0]?.id : workspaceId);
  const { tasks, isLoading: tasksLoading, addTask, editTask, removeTask, reorder, archiveTask } = useTasks(selectedTeam?.id, effectiveWorkspaceId);
  const { groups: checklistGroups } = useChecklist();
  const { tasks: assignedTasks, isLoading: assignedLoading } = useAssignedTasks(selectedTeam?.id, "me");
  const currentWorkspace = effectiveWorkspaceId ? workspaces.find((w: Workspace) => w.id === effectiveWorkspaceId) : null;
  const currentChecklist = checklistId ? checklistGroups.find((g: ChecklistGroup) => g.id === checklistId) : null;
  const workspaceName = currentWorkspace?.name || "";
  const [activeTab, setActiveTab] = useState<"all" | "board">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wrapTaskName, setWrapTaskName] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(workspaceName);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });
  const filterRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [teamMode, setTeamMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  useEffect(() => {
    setTitleValue(workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    if (onMobile && !workspaceId && workspaces[0]?.id) {
      navigate(`/dashboard?workspace=${workspaces[0].id}`, { replace: true });
    }
  }, [onMobile, workspaceId, workspaces, navigate]);

  useEffect(() => {
    if (effectiveWorkspaceId && currentWorkspace) {
      document.title = workspaceName
        ? `${workspaceName} - Plano`
        : "Plano - The Ultimate task management software";
    } else {
      document.title = "Plano - The Ultimate task management software";
    }
  }, [effectiveWorkspaceId, currentWorkspace, workspaceName]);

  useEffect(() => {
    setFilterMember(null);
    setSearchQuery("");
    setSearchOpen(false);
    setShowArchived(false);
    setSelectedIds([]);
  }, [workspaceId]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSaveTitle = async () => {
    if (!workspaceId || !titleValue.trim()) return;
    const trimmed = titleValue.trim();
    setTitleValue(trimmed);
    try {
      await updateWorkspace(workspaceId, trimmed);
      navigate(`/dashboard?workspace=${workspaceId}`, { replace: true });
    } catch {
      // Redux stores and renders the API error.
    }
    setEditingTitle(false);
  };

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([
    { label: "New", color: "bg-purple-500/20 text-purple-300" },
    { label: "In progress", color: "bg-sky-500/20 text-sky-300" },
    { label: "In review", color: "bg-blue-600/20 text-blue-300" },
    { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
    { label: "Need info", color: "bg-yellow-500/20 text-yellow-300" },
    { label: "Done", color: "bg-green-600/20 text-green-300" },
    { label: "Duplicate", color: "bg-slate-600/20 text-slate-300" },
    { label: "Invalid", color: "bg-red-600/20 text-red-300" },
    { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
    { label: "PR Raised", color: "bg-rose-500/20 text-rose-300" },
    { label: "Ready for Test", color: "bg-emerald-500/20 text-emerald-300" },
    { label: "Need Approval", color: "bg-violet-500/20 text-violet-300" },
  ]);

  useEffect(() => {
    if (filterOpen && filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect();
      setFilterMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [filterOpen]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterMember) {
      const member = selectedTeam?.members?.find((m) => m.userId === filterMember);
      if (member) result = result.filter((t) => t.assignedTo.name === member.name);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    result = result.filter((t) => (showArchived ? t.isArchived : !t.isArchived));
    return result;
  }, [tasks, filterMember, selectedTeam?.members, searchQuery, showArchived]);

  const archivedCount = useMemo(() => tasks.filter((t) => t.isArchived).length, [tasks]);

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const createdTeam = await addTeam(teamName);
      if (createdTeam) setTeamName("");
    } catch {
      // Redux stores and renders the API error.
    }
  };

  const handleJoinTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const joinedTeam = await joinTeam(inviteCode);
      if (joinedTeam) setInviteCode("");
    } catch {
      // Redux stores and renders the API error.
    }
  };

  if (checklistId && currentChecklist) {
    return <ChecklistView group={currentChecklist} />;
  }

  if (onMobile && effectiveWorkspaceId && currentWorkspace) {
    const tasksToShow = tasks.filter((t) => !t.isArchived);
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: currentWorkspace.color + "1A" }}
          >
            <span style={{ color: currentWorkspace.color }}>
              <WorkspaceIcon name={currentWorkspace.icon} size={20} />
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{currentWorkspace.name}</h1>
        </div>
        <MobileTaskList
          tasks={tasksToShow}
          statusOptions={statusOptions}
          teamId={selectedTeam?.id}
          workspaceId={effectiveWorkspaceId}
          onTaskUpdate={editTask}
        />
      </div>
    );
  }

  if (!onMobile && workspaceId && currentWorkspace) {
    return (
      <div className="px-12 py-8">

        <div className="ml-5 flex items-center gap-3 mb-8 pl-8">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: currentWorkspace.color + "1A" }}
          >
            <span style={{ color: currentWorkspace.color }}>
              <WorkspaceIcon name={currentWorkspace.icon} size={22} />
            </span>
          </div>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              className="text-3xl font-bold text-foreground bg-transparent outline-none border-b-2 border-foreground/20 focus:border-foreground/50"
            />
          ) : (
            <h1
              className="text-3xl font-bold text-foreground cursor-pointer"
              onClick={() => setEditingTitle(true)}
            >
              {titleValue}
            </h1>
          )}
        </div>

        <div className="ml-5 flex items-center justify-between mb-8">
          <div className="flex items-center gap-1 pl-8">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                activeTab === "all"
                  ? "bg-[#2b2b2b] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun size={14} />
              All Tasks
            </button>
            <button
              onClick={() => setActiveTab("board")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                activeTab === "board"
                  ? "bg-[#2b2b2b] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard size={14} />
              Board View
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  archiveTask([...selectedIds], !showArchived);
                  setSelectedIds([]);
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer bg-red-500/15 text-red-400 hover:bg-red-500/25"
              >
                <Archive size={14} />
                {showArchived ? "Remove from archive" : "Add to archive"}
                <span className="rounded-full bg-red-500/20 px-1.5 text-xs">
                  {selectedIds.length}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="relative flex items-center">
              <button
                ref={filterRef}
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer relative",
                  filterMember
                    ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Filter by member"
              >
                <Filter size={14} />
                {filterMember && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/75 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  </span>
                )}
              </button>
              {filterMember && selectedTeam?.members && (() => {
                const m = selectedTeam.members.find(m => m.userId === filterMember);
                if (!m) return null;
                return (
                  <div className="ml-1 flex items-center gap-1 rounded-md bg-blue-500/10 pl-2 pr-1 py-1 text-xs text-blue-400">
                    <span>{m.name}</span>
                    <button
                      onClick={() => { setFilterMember(null); setFilterOpen(false); }}
                      className="flex h-4 w-4 items-center justify-center rounded hover:bg-blue-500/20 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })()}
            </div>
            {searchOpen ? (
              <div className="flex items-center">
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  placeholder="Search tasks..."
                  className="h-7 w-48 rounded-md border border-border/50 bg-transparent px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer -ml-1"
                  title="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer",
                  searchQuery ? "text-blue-400" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Search"
              >
                <Search size={14} />
              </button>
            )}
            {/* <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={14} />
            </button> */}
            <div className="w-2" />
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                showArchived
                  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                  : "text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
              )}
            >
              <Archive size={14} />
              Archived
              {archivedCount > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 text-xs font-medium">
                  {archivedCount}
                </span>
              )}
              {showArchived && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400/75 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                  <span
                    role="button"
                    aria-label="Clear archive filter"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowArchived(false);
                    }}
                    className="flex h-4 w-4 items-center justify-center rounded hover:bg-red-500/20 cursor-pointer"
                  >
                    <X size={10} />
                  </span>
                </>
              )}
            </button>
            <div className="w-2" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 cursor-pointer"
            >
              <Plus size={14} />
              New
            </button>
          </div>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              {createPortal(
                <div
                  className="fixed z-20 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px]"
                  style={{ top: filterMenuPos.top, left: filterMenuPos.left }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Filter by member
                  </div>
                  <div className="border-t border-border/50 my-1" />
                  {selectedTeam?.members?.map((member) => {
                    const isSelected = filterMember === member.userId;
                    return (
                      <button
                        key={member.userId}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left cursor-pointer",
                          isSelected && "bg-white/5"
                        )}
                        onClick={() => {
                          setFilterMember(isSelected ? null : member.userId);
                          setFilterOpen(false);
                        }}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-medium">
                          {member.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="flex-1 text-foreground">{member.name}</span>
                        {isSelected && <Check size={14} className="text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                  {filterMember && (
                    <>
                      <div className="border-t border-border/50 my-1" />
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left cursor-pointer text-red-300"
                        onClick={() => {
                          setFilterMember(null);
                          setFilterOpen(false);
                        }}
                      >
                        <X size={14} />
                        Clear filter
                      </button>
                    </>
                  )}
                </div>,
                document.body
              )}
            </>
          )}
        </div>

        {activeTab === "all" ? (
          <>
            <div className="hidden md:block -ml-10">
              <NotionTable
                isLoading={tasksLoading}
                wrapTaskName={wrapTaskName}
                statusOptions={statusOptions}
                onStatusOptionsChange={setStatusOptions}
                teamId={selectedTeam?.id}
                workspaceId={workspaceId}
                members={selectedTeam?.members}
                tasks={filteredTasks}
                onTaskCreate={addTask}
                onTaskUpdate={editTask}
                onTaskDelete={removeTask}
                onTaskReorder={reorder}
                createModalOpen={showCreateModal}
                onCreateModalChange={setShowCreateModal}
                selectedIds={selectedIds}
                onToggleSelect={(id) =>
                  setSelectedIds((prev) =>
                    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
                  )
                }
              />
            </div>
            <div className="block md:hidden">
              <MobileTaskList
                tasks={filteredTasks}
                statusOptions={statusOptions}
                teamId={selectedTeam?.id}
                workspaceId={workspaceId}
                onTaskUpdate={editTask}
              />
            </div>
          </>
        ) : (
          <BoardView
            tasks={tasks}
            statusOptions={statusOptions}
            onTaskUpdate={editTask}
            onTaskCreate={addTask}
            onTaskReorder={reorder}
            teamId={selectedTeam?.id}
            workspaceId={workspaceId}
          />
        )}

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          wrapTaskName={wrapTaskName}
          onToggleWrap={() => setWrapTaskName(!wrapTaskName)}
          statusOptions={statusOptions}
          onStatusOptionsChange={setStatusOptions}
        />
      </div>
    );
  }

  const assignedCount = assignedTasks.length;
  const pendingCount = assignedTasks.filter((t) => t.status !== "Done").length;

  return (
    <div className="max-w-5xl mx-auto px-16 py-16">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{' '}
          {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {teams.length > 0
            ? "Select a workspace to get started."
            : "Create or join a team to start collaborating."}
        </p>
      </div>

      {teams.length > 0 && selectedTeam ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ClipboardList size={16} />
                <span className="text-xs font-medium">My Tasks</span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {assignedLoading ? "..." : assignedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <LayoutDashboard size={16} />
                <span className="text-xs font-medium">Workspaces</span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{workspaces.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users size={16} />
                <span className="text-xs font-medium">Members</span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {selectedTeam.members?.length || 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock size={16} />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {assignedLoading ? "..." : pendingCount}
              </p>
            </div>
          </div>

          {/* Team card */}
          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Team
              </h2>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-foreground">{selectedTeam.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedTeam.members?.length || 0} member{(selectedTeam.members?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                {selectedTeam.inviteCode && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Invite
                    </span>
                    <code className="text-xs font-mono text-foreground tracking-wider">
                      {selectedTeam.inviteCode}
                    </code>
                  </div>
                )}
              </div>
              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <div className="mt-4 flex items-center gap-1.5">
                  {selectedTeam.members.slice(0, 6).map((m) => (
                    <div
                      key={m.userId}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-medium text-blue-400 ring-2 ring-card"
                      title={m.name}
                    >
                      {m.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  ))}
                  {selectedTeam.members.length > 6 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                      +{selectedTeam.members.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Workspaces grid */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Workspaces
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/dashboard?workspace=${w.id}`)}
                  className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-5 text-left transition-all hover:border-border/80 hover:bg-accent/50 cursor-pointer group"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: w.color + "1A" }}
                  >
                    <span style={{ color: w.color }}>
                      <WorkspaceIcon name={w.icon} size={20} />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{w.name}</p>
                </button>
              ))}
              {/* Add workspace card */}
              <button
                onClick={() => setWorkspaceModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 bg-card/30 p-5 text-center transition-all hover:border-border/60 hover:bg-accent/30 cursor-pointer min-h-[100px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                  <Plus size={20} />
                </div>
                <span className="text-xs text-muted-foreground">New workspace</span>
              </button>
            </div>
          </section>

          <WorkspaceModal
            open={workspaceModalOpen}
            onOpenChange={setWorkspaceModalOpen}
            onSave={async (value) => {
              await addWorkspace(value.name, value.icon, value.color);
            }}
          />
        </>
      ) : (
        /* No team — create / join */
        <section className="max-w-lg">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Set up your team
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create a new team or join one with an invite code.
          </p>

          <div className="inline-flex rounded-lg border border-border/50 bg-card p-1 mb-6">
            <button
              type="button"
              onClick={() => setTeamMode("create")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
                teamMode === "create"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus size={15} className="inline mr-1.5" />
              Create
            </button>
            <button
              type="button"
              onClick={() => setTeamMode("join")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all cursor-pointer",
                teamMode === "join"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus size={15} className="inline mr-1.5" />
              Join
            </button>
          </div>

          {teamMode === "create" ? (
            <form onSubmit={handleCreateTeam} className="flex items-center gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                disabled={teamsLoading}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border/50 bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-border"
              />
              <button
                type="submit"
                disabled={!teamName.trim() || teamsLoading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {teamsLoading ? "Creating..." : "Create team"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinTeam} className="flex items-center gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Invite code"
                disabled={teamsLoading}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border/50 bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-border uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={!inviteCode.trim() || teamsLoading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {teamsLoading ? "Joining..." : "Join"}
              </button>
            </form>
          )}

          {teamsError && (
            <p className="mt-3 text-sm text-red-400">{teamsError}</p>
          )}
        </section>
      )}
    </div>
  );
}
