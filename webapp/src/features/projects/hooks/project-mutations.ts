import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/lib/query-keys";
import { archiveProject, createProject, updateProject } from "../api/projects-api";
import type { ProjectFormInput } from "../schemas/project-schema";

export function useCreateProject(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectFormInput) => createProject(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(orgId) });
    },
  });
}

export function useUpdateProject(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectFormInput) => updateProject(orgId, projectId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(orgId, projectId), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(orgId) });
    },
  });
}

export function useArchiveProject(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => archiveProject(orgId, projectId),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(orgId, projectId), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(orgId) });
    },
  });
}
