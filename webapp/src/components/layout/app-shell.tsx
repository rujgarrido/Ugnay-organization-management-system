import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { UgnayMark } from "@/components/brand/ugnay-mark";
import { useAuth } from "@/features/auth/useAuth";
import { OrgSwitcher } from "@/features/organizations/components/org-switcher";
import { getInitials, cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "ugnay:sidebar-collapsed";

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-1", collapsed && "justify-center px-0")}>
      <UgnayMark className="size-7 shrink-0" />
      {!collapsed && <span className="text-sm font-semibold tracking-tight">ugnay</span>}
    </div>
  );
}

/**
 * Authenticated application shell: fixed sidebar on desktop, slide-in
 * drawer on mobile, and a top bar with the org switcher and sign-out
 * action. Child routes render through the <Outlet />.
 */
export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Persist the desktop collapse preference across reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // Private-mode storage failures must not break the shell.
    }
  }, [isSidebarCollapsed]);

  function toggleSidebar() {
    setIsSidebarCollapsed((collapsed) => !collapsed);
  }

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Close the mobile drawer with the Escape key.
  useEffect(() => {
    if (!isMobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card transition-[width] duration-200 lg:flex",
          isSidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "relative flex h-14 items-center border-b px-4",
            isSidebarCollapsed
              ? "group/sidebar-toggle justify-center px-2"
              : "justify-between gap-2",
          )}
        >
          <span
            className={cn(
              "min-w-0 transition-opacity",
              // Only the minimized rail swaps the mark for the toggle on hover;
              // when expanded the mark stays put and the toggle sits at the edge.
              isSidebarCollapsed &&
                "group-hover/sidebar-toggle:opacity-0 group-focus-within/sidebar-toggle:opacity-0",
            )}
          >
            <BrandMark collapsed={isSidebarCollapsed} />
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
            className={cn(
              isSidebarCollapsed
                ? "absolute inset-0 m-auto opacity-0 transition-opacity group-hover/sidebar-toggle:opacity-100 focus-visible:opacity-100"
                : "shrink-0",
            )}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        </div>
        <AppSidebar collapsed={isSidebarCollapsed} />
        {user && (
          <div className="border-t p-3">
            <div className={cn("flex items-center gap-2.5 px-1", isSidebarCollapsed && "justify-center px-0")}>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                aria-hidden="true"
                title={isSidebarCollapsed ? displayName : undefined}
              >
                {getInitials(displayName)}
              </span>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay + drawer */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="mobile-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:hidden",
          isMobileNavOpen ? "translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <BrandMark />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <AppSidebar onNavigate={() => setIsMobileNavOpen(false)} />
      </aside>

      <div className={cn("flex min-h-screen flex-col", isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation"
            aria-label="Open navigation"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>

          <div className="min-w-0 flex-1">
            <OrgSwitcher />
          </div>

          <div className="ml-auto flex shrink-0 items-center">
            <UserMenu />
          </div>

        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


