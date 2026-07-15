import {
  Briefcase,
  Bug,
  Code2,
  Folder,
  Lightbulb,
  Megaphone,
  Settings,
  Sparkles,
  TriangleAlert,
  Volume2,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceIconOption {
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const workspaceIconOptions: WorkspaceIconOption[] = [
  { name: "bug", label: "Bugs", Icon: Bug },
  { name: "megaphone", label: "Marketing", Icon: Megaphone },
  { name: "speaker", label: "Mega Speaker", Icon: Volume2 },
  { name: "sparkles", label: "New", Icon: Sparkles },
  { name: "settings", label: "Settings", Icon: Settings },
  { name: "lightbulb", label: "Idea Bulb", Icon: Lightbulb },
  { name: "code", label: "Code", Icon: Code2 },
  { name: "alert-triangle", label: "Error", Icon: TriangleAlert },
  { name: "briefcase", label: "Business", Icon: Briefcase },
  { name: "folder", label: "Folder", Icon: Folder },
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
