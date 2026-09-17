import { api } from "@/lib/axios";
import type {
  ActivityEntityTypeFilter,
  ActivityPage,
  DashboardOverview,
} from "../types/dashboard";

/**
 * Real data layer for the dashboard (US-4.1 / US-4.2).
 * Backend contract: GET /organizations/:orgId/dashboard, GET .../activity.
 */

export async function getDashboardOverview(orgId: string): Promise<DashboardOverview> {
  const { data } = await api.get<{ data: DashboardOverview }>(`/organizations/${orgId}/dashboard`);
  return data.data;
}

export async function getDashboardActivity(
  orgId: string,
  page: number,
  entityType: ActivityEntityTypeFilter = "all",
): Promise<ActivityPage> {
  const { data } = await api.get<{ data: ActivityPage }>(`/organizations/${orgId}/activity`, {
    params: { page, entityType },
  });
  return data.data;
}