import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "@/lib/query-keys";
import { getTasks } from "../api/projects-api";

export function useTasks(orgId: string | null, projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.list(projectId ?? ""),
    queryFn: () => getTasks(orgId ?? "", projectId ?? ""),
    enabled: orgId !== null && projectId !== undefined,
  });
}
