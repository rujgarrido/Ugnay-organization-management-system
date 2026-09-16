import { NavLink } from "react-router-dom";
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Operational navigation only. Organization settings (profile, positions &
// permissions) is config, not a daily destination — it lives behind the org
// switcher menu and is gated by MANAGE_MEMBERS (see org-switcher.tsx).
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/members", label: "Members", icon: Users },
      { to: "/proposals", label: "Proposals", icon: FileText },
    ],
  },
];

interface AppSidebarProps {
  /** Called after a navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
          )}
          {group.items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}