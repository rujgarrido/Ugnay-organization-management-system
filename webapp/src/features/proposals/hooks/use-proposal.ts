import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { getProposal } from "../api/proposals-api";

export function useProposal(orgId: string | null, proposalId: string | undefined) {
  return useQuery({
    queryKey: proposalKeys.detail(orgId ?? "", proposalId ?? ""),
    queryFn: () => getProposal(orgId ?? "", proposalId ?? ""),
    enabled: orgId !== null && proposalId !== undefined,
  });
}
