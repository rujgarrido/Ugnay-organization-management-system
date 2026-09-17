import { Outlet } from "react-router-dom";
import { NoOrganizationState } from "@/components/no-organization-state";
import { RouteTabs } from "@/components/route-tabs";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";

/** Organization settings shell with Profile / Positions tabs (spec US-2.6/2.7). */
export function OrganizationSettingsLayout() {
  const membership = useActiveOrganization();

  if (!membership) {
    return <NoOrganizationState />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Organization</h1>
        <p className="text-sm text-muted-foreground">Settings for {membership.organization.name}.</p>
      </header>

      <RouteTabs
        ariaLabel="Organization settings sections"
        tabs={[
          { to: "/organization/profile", label: "Profile" },
          { to: "/organization/positions", label: "Positions & Permissions" },
        ]}
      />

      <Outlet />
    </div>
  );
}
