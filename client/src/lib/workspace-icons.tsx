import {
  Activity,
  BookOpen,
  Briefcase,
  Bug,
  Calendar,
  Cloud,
  Code2,
  Database,
  Folder,
  Heart,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Palette,
  PenTool,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  TriangleAlert,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceIconOption {
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const workspaceIconOptions: WorkspaceIconOption[] = [
  { name: "briefcase", label: "Business", Icon: Briefcase },
  { name: "folder", label: "Folder", Icon: Folder },
  { name: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { name: "rocket", label: "Launch", Icon: Rocket },
  { name: "code", label: "Code", Icon: Code2 },
  { name: "palette", label: "Design", Icon: Palette },
  { name: "megaphone", label: "Marketing", Icon: Megaphone },
  { name: "users", label: "Team", Icon: Users },
  { name: "calendar", label: "Schedule", Icon: Calendar },
  { name: "target", label: "Goals", Icon: Target },
  { name: "bug", label: "Bugs", Icon: Bug },
  { name: "alert-triangle", label: "Warning", Icon: TriangleAlert },
  { name: "lightbulb", label: "Ideas", Icon: Lightbulb },
  { name: "heart", label: "Favorites", Icon: Heart },
  { name: "star", label: "Featured", Icon: Star },
  { name: "book-open", label: "Documentation", Icon: BookOpen },
  { name: "shield", label: "Security", Icon: Shield },
  { name: "zap", label: "Performance", Icon: Zap },
  { name: "cloud", label: "Cloud", Icon: Cloud },
  { name: "database", label: "Database", Icon: Database },
  { name: "settings", label: "Settings", Icon: Settings },
  { name: "activity", label: "Analytics", Icon: Activity },
  { name: "pen-tool", label: "Content", Icon: PenTool },
  { name: "message-square", label: "Communication", Icon: MessageSquare },
];

export function WorkspaceIcon({
  name,
  size = 16,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const option =
    workspaceIconOptions.find((item) => item.name === name) ||
    workspaceIconOptions[0];
  const Icon = option.Icon;

  return <Icon size={size} className={className} />;
}
