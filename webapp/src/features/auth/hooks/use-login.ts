import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/auth-api";
import { useAuth } from "../useAuth";
import type { LoginInput } from "../schemas/login-schema";

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