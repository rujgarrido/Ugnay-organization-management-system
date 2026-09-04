import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalKeys } from "@/lib/query-keys";
import { addSignature, completeSignature } from "../api/proposals-api";
import type { SignatureFormInput } from "../schemas/signature-schema";

function useInvalidateSignatures(proposalId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: proposalKeys.signatures(proposalId) });
  };
}

export function useAddSignature(proposalId: string) {
  const invalidateSignatures = useInvalidateSignatures(proposalId);

  return useMutation({
    mutationFn: (input: SignatureFormInput) => addSignature(proposalId, input),
    onSuccess: invalidateSignatures,
  });
}

export function useCompleteSignature(proposalId: string) {
  const invalidateSignatures = useInvalidateSignatures(proposalId);

  return useMutation({
    mutationFn: (signatureId: string) => completeSignature(proposalId, signatureId),
    onSuccess: invalidateSignatures,
  });
}
