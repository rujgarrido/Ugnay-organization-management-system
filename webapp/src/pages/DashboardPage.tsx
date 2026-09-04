import { useEffect, useState } from "react";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardSummaryCards } from "@/features/dashboard/components/dashboard-summary-cards";
import { useDashboardActivity } from "@/features/dashboard/hooks/use-dashboard-activity";
import { useDashboardOverview } from "@/features/dashboard/hooks/use-dashboard-overview";
import type { ActivityEntityTypeFilter } from "@/features/dashboard/types/dashboard";
import { useAuth } from "@/features/auth/useAuth";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { getApiErrorMessage } from "@/lib/api-error";
import { NoOrganizationState } from "@/components/no-organization-state";

function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const membership = useActiveOrganization();
  const [activityEntityType, setActivityEntityType] = useState<ActivityEntityTypeFilter>("all");
  const [activityPage, setActivityPage] = useState(1);
  const orgId = membership?.organization.id ?? null;

  // Re-scope pagination when the active organization changes.
  useEffect(() => {
    setActivityPage(1);
  }, [orgId]);

  const overviewQuery = useDashboardOverview(orgId);
  const activityQuery = useDashboardActivity(orgId, activityPage, activityEntityType);

  function handleEntityTypeChange(next: ActivityEntityTypeFilter) {
    setActivityEntityType(next);
    setActivityPage(1);
  }

  if (!membership) {
    return <NoOrganizationState />;
  }

  const { organization } = membership;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {getGreeting(new Date())}, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here is how{" "}
          <span className="font-medium text-foreground">{organization.name}</span> is doing today.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
        <section aria-label="Workspace overview" className="xl:col-span-2">
          {overviewQuery.isError ? (
            <DashboardErrorState
              message={getApiErrorMessage(overviewQuery.error)}
              onRetry={() => overviewQuery.refetch()}
            />
          ) : (
            <DashboardSummaryCards
              overview={overviewQuery.data}
              isLoading={overviewQuery.isPending}
            />
          )}
        </section>

        <section aria-label="Recent activity">
          <ActivityFeed
            activity={activityQuery.data}
            isLoading={activityQuery.isPending}
            isError={activityQuery.isError}
            errorMessage={activityQuery.error ? getApiErrorMessage(activityQuery.error) : undefined}
            page={activityPage}
            entityType={activityEntityType}
            onPageChange={setActivityPage}
            onEntityTypeChange={handleEntityTypeChange}
            onRetry={() => activityQuery.refetch()}
          />
        </section>
      </div>
    </div>
  );
}

