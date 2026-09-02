import { api } from "../../lib/axios";
import { setAccessToken, clearAccessToken } from "../../lib/auth-token";
import type { AuthResponse } from "./types";
import type { LoginInput, RegisterInput } from "./schemas";

export async function loginRequest(input: LoginInput) {
  const { data } = await api.post<{ data: AuthResponse }>("/auth/login", input);
  setAccessToken(data.data.accessToken);
  return data.data;
}

export async function registerRequest(
  input: RegisterInput
) {
  const { data } = await api.post<{ data: { user: AuthResponse["user"] } }>(
    "/auth/register",
    input
  );
  return data.data.user;
}

export async function logoutRequest() {
  await api.post("/auth/logout");
  clearAccessToken();
}