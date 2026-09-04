import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface RouteTab {
  to: string;
  label: string;
}

interface RouteTabsProps {
  tabs: RouteTab[];
  ariaLabel: string;
}

/** Route-driven tab navigation: each tab is a link, the active route is highlighted. */
export function RouteTabs({ tabs, ariaLabel }: RouteTabsProps) {
  return (
    <nav aria-label={ariaLabel} className="flex gap-4 overflow-x-auto border-b">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              "-mb-px whitespace-nowrap border-b-2 px-1 pb-2.5 pt-1 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
