import NotionTable, { type StatusOption } from "@/components/table/notion-table";
import { useAssignedTasks } from "@/hooks/useAssignedTasks";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LuUserRoundCheck } from "react-icons/lu";
import { Filter, Search, X, Archive, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";

export default function AssignedTasks() {
  const { selectedTeam } = useTeams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isMembersView = searchParams.get("view") === "members";
  const urlUserId = searchParams.get("userId");

  const allMembers = selectedTeam?.members ?? [];
  const otherMembers = allMembers.filter((m) => m.userId !== user?._id);
  const membersForSelect = isMembersView ? otherMembers : allMembers;
  const isValidInList = (id: string) => membersForSelect.some((m) => m.userId === id);

  let selectedUserId: string;
  if (isMembersView) {
    selectedUserId =
      urlUserId && isValidInList(urlUserId) ? urlUserId : (otherMembers[0]?.userId ?? "");
  } else {
    selectedUserId =
      urlUserId && urlUserId !== "me" && isValidInList(urlUserId) ? urlUserId : "me";
  }

  const {
    tasks,
    isLoading,
    editTask,
    removeTask,
    archiveTask,
    reorder,
  } = useAssignedTasks(selectedTeam?.id, selectedUserId);

  const selectedMember = membersForSelect.find((m) => m.userId === selectedUserId) ?? null;
  const headingName = selectedMember
    ? selectedMember.name
    : "me";
  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

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

  const wrapTaskName = false;
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });
  const filterRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setFilterMember(null);
    setSearchQuery("");
    setSearchOpen(false);
    setShowArchived(false);
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    if (filterOpen && filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect();
      setFilterMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [filterOpen]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

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

  return (
    <div className="px-12 py-8">
      <div className="ml-5 flex items-center gap-3 mb-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center",
            (selectedUserId === "me" && user) || selectedMember ? "rounded-full" : "rounded-lg bg-blue-400/10"
          )}
        >
          {selectedUserId === "me" && user ? (
            user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                {getInitials(user.name)}
              </div>
            )
          ) : selectedMember ? (
            selectedMember.avatar ? (
              <img src={selectedMember.avatar} alt={selectedMember.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                {getInitials(selectedMember.name)}
              </div>
            )
          ) : (
            <LuUserRoundCheck size={22} className="text-blue-400" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Assigned to {headingName}
        </h1>
      </div>

      <div className="ml-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMembersView && (
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                setSearchParams(
                  { view: "members", userId: value },
                  { replace: true }
                );
              }}
            >
              <SelectTrigger className="h-7 w-auto gap-1 rounded-md border border-border/50 bg-[#252525] px-2 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525]">
                {membersForSelect.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
              const m = selectedTeam?.members?.find((mem) => mem.userId === filterMember);
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
                          {member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
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
      </div>

      <div className="-ml-10">
        <NotionTable
          isLoading={isLoading}
          wrapTaskName={wrapTaskName}
          statusOptions={statusOptions}
          onStatusOptionsChange={setStatusOptions}
          teamId={selectedTeam?.id}
          members={selectedTeam?.members}
          tasks={filteredTasks}
          onTaskUpdate={editTask}
          onTaskDelete={removeTask}
          onTaskReorder={reorder}
          hideAssignee
          hideCreatedBy
          showWorkspace
          hideAddTask
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
            )
          }
        />
      </div>
    </div>
  );
}
