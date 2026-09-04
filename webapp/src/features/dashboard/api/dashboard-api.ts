import type {
  ActivityEntityTypeFilter,
  ActivityPage,
  DashboardOverview,
} from "../types/dashboard";
import {
  MOCK_ACTIVITY_ITEMS,
  MOCK_ACTIVITY_PAGE_SIZE,
  MOCK_DASHBOARD_OVERVIEW,
  MOCK_LATENCY_MS,
} from "./mock-dashboard-data";

/**
 * TEMPORARY mock-backed data layer for the dashboard (US-4.1 / US-4.2).
 *
 * The backend does not expose the dashboard endpoints yet, so these
 * functions resolve isolated mock data with simulated latency. The
 * signatures match the future API contract, so swapping the bodies for
 * real calls through `api` (`@/lib/axios`) requires no changes in the
 * query hooks, components, or types:
 *
 * - getDashboardOverview -> GET /organizations/:orgId/dashboard
 * - getDashboardActivity -> GET /organizations/:orgId/activity?entityType=&page=
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboardOverview(_orgId: string): Promise<DashboardOverview> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_DASHBOARD_OVERVIEW;
}

export async function getDashboardActivity(
  _orgId: string,
  page: number,
  entityType: ActivityEntityTypeFilter = "all",
): Promise<ActivityPage> {
  await delay(MOCK_LATENCY_MS);
  return paginateActivity(page, entityType);
}

function paginateActivity(page: number, entityType: ActivityEntityTypeFilter): ActivityPage {
  const filteredItems =
    entityType === "all"
      ? MOCK_ACTIVITY_ITEMS
      : MOCK_ACTIVITY_ITEMS.filter((item) => item.entityType === entityType);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / MOCK_ACTIVITY_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * MOCK_ACTIVITY_PAGE_SIZE;

  return {
    items: filteredItems.slice(start, start + MOCK_ACTIVITY_PAGE_SIZE),
    page: safePage,
    pageSize: MOCK_ACTIVITY_PAGE_SIZE,
    totalItems,
    totalPages,
  };
}
