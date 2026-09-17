import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "@/lib/query-keys";
import { getProjects } from "../api/projects-api";

export function useProjects(orgId: string | null) {
  return useQuery({
    queryKey: projectKeys.list(orgId ?? ""),
    queryFn: () => getProjects(orgId ?? ""),
    enabled: orgId !== null,
  });
}
