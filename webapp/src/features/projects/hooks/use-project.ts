import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "@/lib/query-keys";
import { getProject } from "../api/projects-api";

export function useProject(orgId: string | null, projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(orgId ?? "", projectId ?? ""),
    queryFn: () => getProject(orgId ?? "", projectId ?? ""),
    enabled: orgId !== null && projectId !== undefined,
  });
}
