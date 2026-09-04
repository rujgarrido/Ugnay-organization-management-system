import type { AccountInput } from "../schemas/account-schema";

/**
 * TEMPORARY mock-backed data layer for the account page.
 *
 * Signature matches the future API contract, so swapping the body for a
 * real call requires no changes in the hook, form, or types:
 *
 * - updateProfileRequest -> PATCH /users/me
 */

const MOCK_LATENCY_MS = 400;

export async function updateProfileRequest(input: AccountInput): Promise<AccountInput> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return { ...input };
}
