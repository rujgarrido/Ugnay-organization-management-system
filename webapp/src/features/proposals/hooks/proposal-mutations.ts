import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { createProposal, updateProposalStatus } from "../api/proposals-api";
import type { ProposalStatus } from "../types/proposal";
import type { ProposalFormInput } from "../schemas/proposal-schema";

export function useCreateProposal(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProposalFormInput) => createProposal(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proposalKeys.list(orgId) });
    },
  });
}

export function useUpdateProposalStatus(orgId: string, proposalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProposalStatus) => updateProposalStatus(orgId, proposalId, status),
    onSuccess: (proposal) => {
      queryClient.setQueryData(proposalKeys.detail(orgId, proposalId), proposal);
      void queryClient.invalidateQueries({ queryKey: proposalKeys.list(orgId) });
    },
  });
}
