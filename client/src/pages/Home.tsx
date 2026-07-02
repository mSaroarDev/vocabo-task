import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart, Lightbulb, Sun, Folder, Settings, Plus, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import NotionTable, { type StatusOption } from "@/components/table/notion-table";
import SettingsModal from "@/components/table/settings-modal";
import { useTeams } from "@/hooks/useTeams";

export default function Home() {
  const [searchParams] = useSearchParams();
  const { teams } = useTeams();
  const workspaceId = searchParams.get("workspace");
  const workspaceName = searchParams.get("name");
  const [activeTab, setActiveTab] = useState<"all" | "category">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wrapTaskName, setWrapTaskName] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(workspaceName ? decodeURIComponent(workspaceName) : "");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([
    { label: "In review", color: "bg-blue-600/20 text-blue-300" },
    { label: "Re Open", color: "bg-amber-500/20 text-amber-300" },
    { label: "Done", color: "bg-green-600/20 text-green-300" },
    { label: "Rejected", color: "bg-zinc-600/30 text-zinc-300" },
  ]);

  if (workspaceId && workspaceName) {
    return (
      <div className="px-12 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Heart size={12} className="text-red-400" fill="currentColor" />
          <span>Vocabo Teamspace</span>
          <span className="text-muted-foreground/40">/</span>
          <Lightbulb size={12} className="text-amber-400" />
          <span>{titleValue}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
            <Lightbulb size={22} className="text-amber-400" />
          </div>
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
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

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
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
              All Bugs
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
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Table */}
        <NotionTable wrapTaskName={wrapTaskName} statusOptions={statusOptions} onStatusOptionsChange={setStatusOptions} />

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

  if (teams.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-16 py-20 relative overflow-hidden">
        {/* Gravity-style animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-blue-400/30 animate-pulse" style={{ animationDelay: "0s" }} />
          <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-purple-400/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-1/3 left-1/3 h-2 w-2 rounded-full bg-pink-400/30 animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-2/3 right-1/4 h-1 w-1 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-green-400/30 animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-10 left-10 h-32 w-32 rounded-full border border-white/[0.04] animate-spin" style={{ animationDuration: "30s" }} />
          <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full border border-white/[0.04] animate-spin" style={{ animationDuration: "40s", animationDirection: "reverse" }} />
        </div>

        <div className="relative max-w-2xl w-full text-center">
          {/* Floating art - abstract people illustration */}
          <div className="mb-8 flex items-center justify-center">
            <div className="relative h-40 w-40">
              {/* Center circle - main user */}
              <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.1] flex items-center justify-center backdrop-blur-sm" style={{ animation: "float 3s ease-in-out infinite" }}>
                <Users size={32} className="text-white/80" />
              </div>
              {/* Orbiting circles - team members */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-gradient-to-br from-pink-500/20 to-amber-500/20 border border-white/[0.1] flex items-center justify-center" style={{ animation: "orbit-1 4s linear infinite" }}>
                <div className="h-2 w-2 rounded-full bg-white/60" />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-white/[0.1] flex items-center justify-center" style={{ animation: "orbit-2 5s linear infinite" }}>
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.1]" style={{ animation: "orbit-3 6s linear infinite" }} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-gradient-to-br from-amber-500/20 to-green-500/20 border border-white/[0.1]" style={{ animation: "orbit-4 4.5s linear infinite" }} />
            </div>
          </div>

          <h1 className="text-4xl font-semibold text-foreground mb-3">
            You have no team yet
          </h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Create your first team to start collaborating, or join an existing one with an invite code.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => alert("Create team flow")}
              className="inline-flex items-center gap-2 rounded-md bg-white text-black px-5 py-2 text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Create your first team
            </button>
            <button
              onClick={() => alert("Join team flow")}
              className="inline-flex items-center gap-2 rounded-md border border-white/[0.15] bg-transparent px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <UserPlus size={16} />
              Join a team
            </button>
          </div>

          <div className="mt-10 text-xs text-muted-foreground/60">
            Tip: Teams let you organize workspaces, share pages, and collaborate in real-time.
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes orbit-1 {
            0% { transform: translate(-50%, 0) rotate(0deg) translateY(-60px) rotate(0deg); }
            100% { transform: translate(-50%, 0) rotate(360deg) translateY(-60px) rotate(-360deg); }
          }
          @keyframes orbit-2 {
            0% { transform: translate(-50%, 0) rotate(0deg) translateY(60px) rotate(0deg); }
            100% { transform: translate(-50%, 0) rotate(-360deg) translateY(60px) rotate(360deg); }
          }
          @keyframes orbit-3 {
            0% { transform: translate(0, -50%) rotate(0deg) translateX(-60px) rotate(0deg); }
            100% { transform: translate(0, -50%) rotate(360deg) translateX(-60px) rotate(-360deg); }
          }
          @keyframes orbit-4 {
            0% { transform: translate(0, -50%) rotate(0deg) translateX(60px) rotate(0deg); }
            100% { transform: translate(0, -50%) rotate(-360deg) translateX(60px) rotate(360deg); }
          }
        `}</style>
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
    </div>
  );
}