import { api } from "@/lib/axios";
import type { AccountInput } from "../schemas/account-schema";

/**
 * Real data layer for the account page (US-1.7): PATCH /users/me.
 * The response user mirrors the input shape, so hooks merge it into the
 * session user without a mapping layer.
 */

export async function updateProfileRequest(input: AccountInput): Promise<AccountInput> {
  const { data } = await api.patch<{ data: { user: AccountInput } }>('/users/me', input);
  return data.data.user;
}