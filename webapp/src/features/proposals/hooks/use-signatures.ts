import { useQuery } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { getSignatures } from "../api/proposals-api";

export function useSignatures(proposalId: string | undefined) {
  return useQuery({
    queryKey: proposalKeys.signatures(proposalId ?? ""),
    queryFn: () => getSignatures(proposalId ?? ""),
    enabled: proposalId !== undefined,
  });
}
