import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/query-keys";
import { addMember, deactivateMember, updateMemberPosition } from "../api/organizations-api";
import type { AddMemberInput } from "../schemas/add-member-schema";

function useInvalidateMembers(orgId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
  };
}

export function useAddMember(orgId: string) {
  const invalidateMembers = useInvalidateMembers(orgId);

  return useMutation({
    mutationFn: (input: AddMemberInput) => addMember(orgId, input),
    onSuccess: invalidateMembers,
  });
}

export function useUpdateMemberPosition(orgId: string) {
  const invalidateMembers = useInvalidateMembers(orgId);

  return useMutation({
    mutationFn: ({ memberId, positionId }: { memberId: string; positionId: string }) =>
      updateMemberPosition(orgId, memberId, positionId),
    onSuccess: invalidateMembers,
  });
}

export function useDeactivateMember(orgId: string) {
  const invalidateMembers = useInvalidateMembers(orgId);

  return useMutation({
    mutationFn: (memberId: string) => deactivateMember(orgId, memberId),
    onSuccess: invalidateMembers,
  });
}
