import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { updateProfileRequest } from "../api/account-api";
import type { AccountInput } from "../schemas/account-schema";

/** Saves the profile and keeps the authenticated user in sync. */
export function useUpdateProfile() {
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: (input: AccountInput) => updateProfileRequest(input),
    onSuccess: (profile) => {
      if (user) {
        setUser({ ...user, ...profile });
      }
    },
  });
}
