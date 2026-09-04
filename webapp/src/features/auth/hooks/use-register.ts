import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth-api";
import type { RegisterInput } from "../schemas/register-schema";

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: RegisterInput) => registerRequest(input),
    onSuccess: () => {
      navigate("/login");
    },
  });
}