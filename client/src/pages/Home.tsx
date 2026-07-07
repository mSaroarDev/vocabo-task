import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Sun, Folder, Filter, ArrowUpDown, Search, Settings, Plus, UserPlus } from "lucide-react";
import { WorkspaceIcon } from "@/lib/workspace-icons";
import { cn } from "@/lib/utils";
import NotionTable, { type StatusOption } from "@/components/table/notion-table";
import SettingsModal from "@/components/table/settings-modal";
import ChecklistView from "@/components/checklist/checklist-view";
import { useTeams } from "@/hooks/useTeams";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useTasks } from "@/hooks/useTasks";
import { useChecklist } from "@/hooks/useChecklist";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { teams, selectedTeam, addTeam, joinTeam, isLoading: teamsLoading, error: teamsError } = useTeams();
  const workspaceId = searchParams.get("workspace");
  const checklistId = searchParams.get("checklist");
  const { workspaces, updateWorkspace } = useWorkspaces(selectedTeam?.id);
  const { tasks, addTask, editTask, removeTask, reorder } = useTasks(selectedTeam?.id, workspaceId);
  const { groups: checklistGroups } = useChecklist();
  const currentWorkspace = workspaceId ? workspaces.find((w) => w.id === workspaceId) : null;
  const currentChecklist = checklistId ? checklistGroups.find((g) => g.id === checklistId) : null;
  const workspaceName = currentWorkspace?.name || "";
  const [activeTab, setActiveTab] = useState<"all" | "category">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wrapTaskName, setWrapTaskName] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(workspaceName);
  const [teamMode, setTeamMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  useEffect(() => {
    setTitleValue(workspaceName);
  }, [workspaceName]);

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
        <div className="ml-5 flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Heart size={12} className="text-red-400" fill="currentColor" />
          <span>Vocabo Teamspace</span>
          <span className="text-muted-foreground/40">/</span>
          <WorkspaceIcon name={currentWorkspace.icon} size={12} className="text-amber-400" />
          <span>{titleValue}</span>
        </div>

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
              onClick={() => setActiveTab("category")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                activeTab === "category"
                  ? "bg-[#2b2b2b] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Folder size={14} />
              By Category
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer" title="Filter">
              <Filter size={14} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer" title="Sort">
              <ArrowUpDown size={14} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer" title="Search">
              <Search size={14} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={14} />
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
        </div>

        <div className="-ml-5">
          <NotionTable
            wrapTaskName={wrapTaskName}
            statusOptions={statusOptions}
            onStatusOptionsChange={setStatusOptions}
            teamId={selectedTeam?.id}
            workspaceId={workspaceId}
            members={selectedTeam?.members}
            tasks={tasks}
            onTaskCreate={addTask}
            onTaskUpdate={editTask}
            onTaskDelete={removeTask}
            onTaskReorder={reorder}
            createModalOpen={showCreateModal}
            onCreateModalChange={setShowCreateModal}
          />
        </div>

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
        Vocabo / Home
      </div>

      <h1 className="text-4xl font-semibold text-foreground mb-1">
        Getting Started
      </h1>

      <p className="text-sm text-muted-foreground mb-8">
        Select a workspace from the sidebar to view tasks.
      </p>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Welcome to Vocabo.</p>
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
