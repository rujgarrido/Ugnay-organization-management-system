import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "@/lib/query-keys";
import { getTasks } from "../api/projects-api";

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.list(projectId ?? ""),
    queryFn: () => getTasks(projectId ?? ""),
    enabled: projectId !== undefined,
  });
}
