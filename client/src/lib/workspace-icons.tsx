import {
  Briefcase,
  Calendar,
  Code2,
  Folder,
  LayoutDashboard,
  Megaphone,
  Palette,
  Rocket,
  Target,
  Users,
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
