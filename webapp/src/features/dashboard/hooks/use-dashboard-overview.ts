import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "@/lib/query-keys";
import { getDashboardOverview } from "../api/dashboard-api";

/**
 * Loads the organization dashboard counts. Pass `null` while no active
 * organization is resolved to keep the query disabled instead of
 * fetching unscoped data.
 */
export function useDashboardOverview(orgId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.overview(orgId ?? ""),
    queryFn: () => getDashboardOverview(orgId ?? ""),
    enabled: orgId !== null,
  });
}
