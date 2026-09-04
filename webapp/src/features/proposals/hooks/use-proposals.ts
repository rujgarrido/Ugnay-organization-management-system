import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { getProposals } from "../api/proposals-api";

export function useProposals(orgId: string | null) {
  return useQuery({
    queryKey: proposalKeys.list(orgId ?? ""),
    queryFn: () => getProposals(orgId ?? ""),
    enabled: orgId !== null,
  });
}
