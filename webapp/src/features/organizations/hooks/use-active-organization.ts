import { useActiveOrg } from "./use-active-org";
import type { OrganizationMembership } from "../types";

/**
 * Convenience accessor for the active organization membership.
 * The selection itself lives in ActiveOrgProvider and is changed
 * through the org switcher in the top bar.
 */
export function useActiveOrganization(): OrganizationMembership | null {
  return useActiveOrg().activeMembership;
}
