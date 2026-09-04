import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/query-keys";
import { getPositions } from "../api/organizations-api";

export function usePositions(orgId: string | null) {
  return useQuery({
    queryKey: organizationKeys.positions(orgId ?? ""),
    queryFn: () => getPositions(orgId ?? ""),
    enabled: orgId !== null,
  });
}
