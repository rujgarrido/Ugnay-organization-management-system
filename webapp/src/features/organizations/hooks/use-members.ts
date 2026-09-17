import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/query-keys";
import { getMembers } from "../api/organizations-api";

export function useMembers(orgId: string | null) {
  return useQuery({
    queryKey: organizationKeys.members(orgId ?? ""),
    queryFn: () => getMembers(orgId ?? ""),
    enabled: orgId !== null,
  });
}
