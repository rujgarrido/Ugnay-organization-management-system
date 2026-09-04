import { createContext } from "react";
import type { OrganizationMembership } from "./types";

export interface ActiveOrgContextValue {
  /** Every active membership of the signed-in user. */
  memberships: OrganizationMembership[];
  /** The membership currently scoping all organization API calls. */
  activeMembership: OrganizationMembership | null;
  /** Switches the active organization and re-scopes all queries. */
  setActiveOrganization: (orgId: string) => void;
}

export const ActiveOrgContext = createContext<ActiveOrgContextValue | undefined>(undefined);
