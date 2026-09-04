import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ActiveOrgProvider } from "@/features/organizations/ActiveOrgProvider";
import { queryClient } from "@/lib/queryClient";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveOrgProvider>{children}</ActiveOrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
