import { LuUserRoundCheck, LuUserRoundCog } from "react-icons/lu";
import {
  Home,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string, searchParams: URLSearchParams) => boolean;
  onClick: (navigate: ReturnType<typeof useNavigate>) => void;
}

const mobileNavItems: MobileNavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    match: (pathname, searchParams) =>
      pathname === "/dashboard" && !searchParams.get("checklist"),
    onClick: (navigate) => navigate("/dashboard"),
  },
  {
    id: "assigned",
    label: "Assigned Me",
    icon: <LuUserRoundCheck size={20} />,
    match: (pathname, searchParams) =>
      pathname === "/assigned-tasks" && searchParams.get("view") !== "members",
    onClick: (navigate) => navigate("/assigned-tasks?userId=me"),
  },
  {
    id: "members",
    label: "Members",
    icon: <LuUserRoundCog size={20} />,
    match: (pathname, searchParams) =>
      pathname === "/assigned-tasks" && searchParams.get("view") === "members",
    onClick: (navigate) => navigate("/assigned-tasks?view=members"),
  },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const userInitials = user
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const navItems = [
    ...mobileNavItems,
    {
      id: "profile",
      label: "Profile",
      icon: (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-medium">
          {userInitials}
        </div>
      ),
      match: (pathname: string) => pathname === "/profile",
      onClick: (navigate: ReturnType<typeof useNavigate>) => navigate("/profile"),
    },
  ];

  const activeId = navItems.find((item) =>
    item.match(pathname, searchParams)
  )?.id;

  return (
    <nav className="flex h-14 shrink-0 items-center justify-around gap-1 border-t border-sidebar-border bg-sidebar px-2">
      {navItems.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => item.onClick(navigate)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            )}
          >
            <span className="flex items-center justify-center">
              {item.icon}
            </span>
            {active && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
