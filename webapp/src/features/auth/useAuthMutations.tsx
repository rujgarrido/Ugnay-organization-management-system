import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest, registerRequest, logoutRequest } from "./api";
import { useAuth } from "./useAuth";
import type { LoginInput, RegisterInput } from "./schemas";

export function useLogin() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: LoginInput) => loginRequest(input),
    onSuccess: (data) => {
      setUser(data.user);
      navigate("/dashboard");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: RegisterInput) => registerRequest(input),
    onSuccess: () => {
      navigate("/login");
    },
  });
}

export function useLogout() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      setUser(null);
      queryClient.clear(); // wipe every cached query — nothing from the old session should leak into the next login
      navigate("/login");
    },
  });
}