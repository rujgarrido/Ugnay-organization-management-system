import { Link } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuth } from "@/features/auth/useAuth";
import { useDismiss } from "@/hooks/use-dismiss";
import { getInitials } from "@/lib/utils";

/** Top-nav account menu (spec US-1.7): profile link and sign out. */
export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  const { ref, isOpen, setIsOpen } = useDismiss();

  if (!user) {
    return null;
  }

  const displayName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground outline-none transition-colors hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        {getInitials(displayName)}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-popover p-1 shadow-md"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            role="menuitem"
            to="/account"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UserRound className="size-3.5" aria-hidden="true" /> Account settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <LogOut className="size-3.5" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
