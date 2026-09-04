import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logoutRequest } from "../api/auth-api";
import { useAuth } from "../useAuth";

export function useLogout() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      setUser(null);
      queryClient.clear();
      navigate("/login");
    },
  });
}