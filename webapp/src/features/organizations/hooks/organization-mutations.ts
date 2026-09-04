import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { queryClient } from "@/lib/queryClient";
import { organizationKeys } from "@/lib/query-keys";
import { useActiveOrg } from "./use-active-org";
import {
  archiveOrganization,
  createOrganization,
  updateOrganization,
} from "../api/organizations-api";
import type { OrganizationFormInput } from "../schemas/organization-form-schema";

export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OrganizationFormInput) => updateOrganization(orgId, input),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKeys.detail(orgId), organization);
    },
  });
}

export function useArchiveOrganization(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => archiveOrganization(orgId),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKeys.detail(orgId), organization);
    },
  });
}

/**
 * Creates an organization and immediately scopes the session to it by
 * appending the returned membership to the signed-in user.
 */
export function useCreateOrganization() {
  const { user, setUser } = useAuth();
  const { setActiveOrganization } = useActiveOrg();

  return useMutation({
    mutationFn: (input: OrganizationFormInput) => createOrganization(input),
    onSuccess: ({ organization, membership }) => {
      if (user) {
        setUser({
          ...user,
          memberships: [...(user.memberships ?? []), membership],
        });
      }
      setActiveOrganization(organization.id);
      // Everything is org-scoped: refresh all cached queries for the new org.
      void queryClient.invalidateQueries();
    },
  });
}
