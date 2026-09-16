import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { addSignature, completeSignature } from "../api/proposals-api";
import type { SignatureFormInput } from "../schemas/signature-schema";

function useInvalidateSignatures(orgId: string, proposalId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: proposalKeys.signatures(proposalId),
    });
    // Signature completion can unblock the approved -> completed transition.
    void queryClient.invalidateQueries({
      queryKey: proposalKeys.detail(orgId, proposalId),
    });
  };
}

export function useAddSignature(orgId: string, proposalId: string) {
  const invalidateSignatures = useInvalidateSignatures(orgId, proposalId);

  return useMutation({
    mutationFn: (input: SignatureFormInput) => addSignature(orgId, proposalId, input),
    onSuccess: invalidateSignatures,
  });
}

export function useCompleteSignature(orgId: string, proposalId: string) {
  const invalidateSignatures = useInvalidateSignatures(orgId, proposalId);

  return useMutation({
    mutationFn: (signatureId: string) => completeSignature(orgId, proposalId, signatureId),
    onSuccess: invalidateSignatures,
  });
}