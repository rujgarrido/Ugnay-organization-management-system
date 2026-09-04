import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/query-keys";
import { getOrganization } from "../api/organizations-api";

export function useOrganization(orgId: string | null) {
  return useQuery({
    queryKey: organizationKeys.detail(orgId ?? ""),
    queryFn: () => getOrganization(orgId ?? ""),
    enabled: orgId !== null,
  });
}
