import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { RouteLoading } from "@/components/route-state";
import { useAuth } from "@/features/auth/useAuth";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // The shell owns the authenticated chrome (sidebar, top bar) and
  // renders the matched child route through its <Outlet />.
  return <AppShell />;
}
