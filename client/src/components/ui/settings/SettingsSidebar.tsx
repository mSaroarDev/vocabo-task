import { cn } from "@/lib/utils";
import {
  Home,
  SlidersHorizontal,
  Bell,
  Mail,
  Settings,
  Users,
  Download,
  Sparkles,
  Globe,
  Smile,
  Building2,
  Shield,
  IdCard,
  ArrowUpCircle,
} from "lucide-react";
import type { NavGroup, User } from "./types";
import { getUserInitials } from "./utils";

function buildNavGroups(user: User | null): NavGroup[] {
  const initials = user ? getUserInitials(user.name) : "U";

  return [
    {
      title: "Account",
      items: [
        {
          id: "profile",
          label: user?.name || "Profile",
          icon: (
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium overflow-hidden",
                user?.avatar ? "" : "bg-[#555] text-white"
              )}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
          ),
        },
        { id: "preferences", label: "Preferences", icon: <SlidersHorizontal size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
        { id: "mail-calendar", label: "Mail & Calendar", icon: <Mail size={16} /> },
      ],
    },
    {
      title: "Workspace",
      items: [
        { id: "general", label: "General", icon: <Settings size={16} /> },
        { id: "people", label: "People", icon: <Users size={16} /> },
        { id: "import", label: "Import", icon: <Download size={16} /> },
      ],
    },
    {
      title: "Features",
      items: [
        { id: "notion-ai", label: "Plano AI", icon: <Sparkles size={16} /> },
        { id: "connections", label: "Connections", icon: <Home size={16} /> },
        { id: "notion-mcp", label: "Notion MCP", icon: <Home size={16} /> },
        { id: "public-pages", label: "Public pages", icon: <Globe size={16} /> },
        { id: "emoji", label: "Emoji", icon: <Smile size={16} /> },
      ],
    },
    {
      title: "Admin",
      items: [
        { id: "workspaces", label: "Teamspaces", icon: <Building2 size={16} /> },
        { id: "security", label: "Security", icon: <Shield size={16} /> },
        { id: "identity", label: "Identity", icon: <IdCard size={16} /> },
      ],
    },
    {
      title: "Access & billing",
      items: [
        { id: "upgrade", label: "Upgrade plan", icon: <ArrowUpCircle size={16} />, highlight: true },
      ],
    },
  ];
}

interface SettingsSidebarProps {
  user: User | null;
  activeNav: string;
  onNavChange: (id: string) => void;
}

export default function SettingsSidebar({ user, activeNav, onNavChange }: SettingsSidebarProps) {
  const navGroups = buildNavGroups(user);

  return (
    <div
      className="w-[220px] shrink-0 overflow-y-auto bg-[#202020] p-4"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#3b3b3b transparent" }}
    >
      <nav className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-[#858585]">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.highlight) onNavChange(item.id);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-[#2F2F2F] text-white"
                        : item.highlight
                          ? "text-[#2F80ED]"
                          : "text-[#9B9B9B] hover:bg-[#2F2F2F] hover:text-white"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
