import { api, refreshCsrfToken } from "@/lib/axios";
import { clearAccessToken, setAccessToken } from "@/lib/auth-token";
import type { AuthResponse } from "../types/auth";
import type { LoginInput } from "../schemas/login-schema";
import type { RegisterInput } from "../schemas/register-schema";

export async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<{ data: AuthResponse }>("/auth/login", input);
  setAccessToken(data.data.accessToken);
  // Login rotates the CSRF cookie but doesn't return the new token, so resync
  // now rather than letting the next mutation 403 and burn a retry.
  await refreshCsrfToken();
  return data.data;
}

export async function registerRequest(
  input: RegisterInput,
): Promise<AuthResponse["user"]> {
  const { data } = await api.post<{ data: { user: AuthResponse["user"] } }>(
    "/auth/register",
    input,
  );
  return data.data.user;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}