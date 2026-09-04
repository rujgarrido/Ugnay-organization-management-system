import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/utils";
import { useActiveOrg } from "../hooks/use-active-org";

/**
 * Top-nav organization switcher (US-1.6): always shows the active
 * organization, lists the user''s orgs plus a create action, and
 * re-scopes every organization-scoped query on selection.
 */
export function OrgSwitcher() {
  const { memberships, activeMembership, setActiveOrganization } = useActiveOrg();
  const { ref, isOpen, setIsOpen } = useDismiss();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (memberships.length === 0) {
    return <span className="truncate px-2 text-sm font-medium text-muted-foreground">No organization</span>;
  }

  const activeOrg = activeMembership?.organization ?? memberships[0].organization;

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Active organization: ${activeOrg.name}. Switch organization`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground"
          aria-hidden="true"
        >
          {activeOrg.name.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-sm font-medium">{activeOrg.name}</span>
        {memberships.length > 1 && (
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Organizations"
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border bg-popover p-1 shadow-md"
        >
          {memberships.map((membership) => {
            const isActive = membership.organization.id === activeOrg.id;

            return (
              <button
                key={membership.organization.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive && "bg-muted",
                )}
                onClick={() => {
                  setActiveOrganization(membership.organization.id);
                  setIsOpen(false);
                }}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {membership.organization.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{membership.organization.name}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {membership.position.name}
                </span>
                {isActive && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}

          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => {
              setIsOpen(false);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden="true" /> Create new organization
          </button>
        </div>
      )}

      <CreateOrganizationDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
