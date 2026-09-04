import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/features/auth/useAuth";
import { OrgSwitcher } from "@/features/organizations/components/org-switcher";
import { getInitials, cn } from "@/lib/utils";

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span
        className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
        aria-hidden="true"
      >
        U
      </span>
      <span className="text-sm font-semibold tracking-tight">ugnay</span>
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <BrandMark />
        </div>
        <AppSidebar />
        {user && (
          <div className="border-t p-3">
            <div className="flex items-center gap-2.5 px-1">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
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

      <div className="flex min-h-screen flex-col lg:pl-64">
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

          <OrgSwitcher />

          <UserMenu />

        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


