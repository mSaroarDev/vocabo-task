import BoardView from "@/components/board/board-view";
import ChecklistView from "@/components/checklist/checklist-view";
import NotionTable, { type StatusOption } from "@/components/table/notion-table";
import SettingsModal from "@/components/table/settings-modal";
import { useChecklist } from "@/hooks/useChecklist";
import { useTasks } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { cn } from "@/lib/utils";
import { WorkspaceIcon } from "@/lib/workspace-icons";
import { Filter, LayoutDashboard, Plus, Search, Sun, UserPlus, Check, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { teams, selectedTeam, addTeam, joinTeam, isLoading: teamsLoading, error: teamsError } = useTeams();
  const workspaceId = searchParams.get("workspace");
  const checklistId = searchParams.get("checklist");
  const { workspaces, updateWorkspace } = useWorkspaces(selectedTeam?.id);
  const { tasks, isLoading: tasksLoading, addTask, editTask, removeTask, reorder } = useTasks(selectedTeam?.id, workspaceId);
  const { groups: checklistGroups } = useChecklist();
  const currentWorkspace = workspaceId ? workspaces.find((w) => w.id === workspaceId) : null;
  const currentChecklist = checklistId ? checklistGroups.find((g) => g.id === checklistId) : null;
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
  const searchRef = useRef<HTMLInputElement>(null);
  const [teamMode, setTeamMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  useEffect(() => {
    setTitleValue(workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    if (workspaceId && currentWorkspace) {
      document.title = workspaceName || "Vocabo";
    } else {
      document.title = "Vocabo";
    }
  }, [workspaceId, currentWorkspace, workspaceName]);

  useEffect(() => {
    setFilterMember(null);
    setSearchQuery("");
    setSearchOpen(false);
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
    return result;
  }, [tasks, filterMember, selectedTeam?.members, searchQuery]);

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

  if (workspaceId && currentWorkspace) {
    return (
      <div className="px-12 py-8">

        <div className="ml-5 flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
            <WorkspaceIcon name={currentWorkspace.icon} size={22} className="text-amber-400" />
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
          <div className="flex items-center gap-1">
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
          <div className="-ml-5">
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
            />
          </div>
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

  return (
    <div className="max-w-3xl mx-auto px-16 py-20">
      <div className="mb-1 text-xs text-muted-foreground">
        Geting Started with
      </div>

      <h1 className="text-4xl font-semibold text-foreground mb-1 my-5">
        Plano
      </h1>

      <p className="text-sm text-muted-foreground mb-8 mt-5">
        Select a workspace from the sidebar to view tasks.
      </p>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Welcome to Plano.</p>
        <p className="text-sm text-muted-foreground">
          This is your workspace. Start typing or select a page from the sidebar.
        </p>
      </div>

      {teams.length === 0 && (
        <section className="mt-10 max-w-xl border-t border-white/[0.08] pt-8">
          <h2 className="text-xl font-semibold text-foreground">
            Set up your team
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new team or join one with an invite code to start collaborating.
          </p>

          <div className="mt-5 inline-flex rounded-md border border-white/[0.12] bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setTeamMode("create")}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors cursor-pointer",
                teamMode === "create"
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus size={15} />
              Create
            </button>
            <button
              type="button"
              onClick={() => setTeamMode("join")}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors cursor-pointer",
                teamMode === "join"
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus size={15} />
              Join
            </button>
          </div>

          {teamMode === "create" ? (
            <form onSubmit={handleCreateTeam} className="mt-5 flex max-w-md items-center gap-2">
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Team name"
                disabled={teamsLoading}
                className="h-10 min-w-0 flex-1 rounded-md border border-white/[0.12] bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!teamName.trim() || teamsLoading}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {teamsLoading ? "Creating..." : "Create team"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinTeam} className="mt-5 flex max-w-md items-center gap-2">
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="Invite code"
                disabled={teamsLoading}
                className="h-10 min-w-0 flex-1 rounded-md border border-white/[0.12] bg-transparent px-3 text-sm uppercase tracking-wide text-foreground outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!inviteCode.trim() || teamsLoading}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/[0.15] px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={16} />
                {teamsLoading ? "Joining..." : "Join team"}
              </button>
            </form>
          )}

          {teamsError && (
            <p className="mt-3 text-sm text-red-300">
              {teamsError}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
