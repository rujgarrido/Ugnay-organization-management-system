import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/lib/query-keys";
import { createTask, updateTaskStatus } from "../api/projects-api";
import type { Task, TaskStatus } from "../types/project";
import type { TaskFormInput } from "../schemas/task-schema";

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskFormInput) => createTask(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
  });
}

/**
 * Optimistically moves the dragged task so the board feels immediate;
 * rolls back from the cached list if the status change fails.
 */
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      const listKey = taskKeys.list(projectId);
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      return { listKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
  });
}
