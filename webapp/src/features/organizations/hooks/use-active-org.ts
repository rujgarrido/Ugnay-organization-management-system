import { useContext } from "react";
import { ActiveOrgContext, type ActiveOrgContextValue } from "../active-org-context";

export function useActiveOrg(): ActiveOrgContextValue {
  const ctx = useContext(ActiveOrgContext);

  if (!ctx) {
    throw new Error("useActiveOrg must be used within ActiveOrgProvider");
  }

  return ctx;
}
