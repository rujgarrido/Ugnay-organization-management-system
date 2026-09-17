import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { ActiveOrgContext, type ActiveOrgContextValue } from "./active-org-context";

/**
 * Owns which organization scopes every authenticated request.
 * The selection defaults to the user's first active membership and is
 * reset whenever the session user changes (login, logout, refresh).
 */
export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const memberships = useMemo(
    () => user?.memberships?.filter((membership) => membership.isActive) ?? [],
    [user],
  );

  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Re-resolve the active organization when the session user changes,
  // while keeping a still-valid selection (e.g. after creating an org).
  useEffect(() => {
    if (!user) {
      setActiveOrgId(null);
      return;
    }

    setActiveOrgId((current) => {
      const stillValid = user.memberships?.some(
        (membership) => membership.isActive && membership.organization.id === current,
      );

      if (stillValid) return current;

      return user.memberships?.find((membership) => membership.isActive)?.organization.id ?? null;
    });
  }, [user]);

  const activeMembership =
    memberships.find((membership) => membership.organization.id === activeOrgId) ??
    memberships[0] ??
    null;

  const value = useMemo<ActiveOrgContextValue>(
    () => ({
      memberships,
      activeMembership,
      setActiveOrganization: setActiveOrgId,
    }),
    [memberships, activeMembership],
  );

  return <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>;
}

