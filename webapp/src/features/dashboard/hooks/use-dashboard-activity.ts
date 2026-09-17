import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "@/lib/query-keys";
import { getDashboardActivity } from "../api/dashboard-api";
import type { ActivityEntityTypeFilter } from "../types/dashboard";

/**
 * Loads one page of the organization activity feed, optionally filtered
 * by entity type. Pass `null` as the orgId while no active organization
 * is resolved to keep the query disabled instead of fetching unscoped data.
 */
export function useDashboardActivity(
  orgId: string | null,
  page: number,
  entityType: ActivityEntityTypeFilter = "all",
) {
  return useQuery({
    queryKey: dashboardKeys.activity(orgId ?? "", page, entityType),
    queryFn: () => getDashboardActivity(orgId ?? "", page, entityType),
    enabled: orgId !== null,
  });
}
