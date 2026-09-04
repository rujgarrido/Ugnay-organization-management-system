import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { NoOrganizationState } from "@/components/no-organization-state";
import { Button } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useTasks } from "@/features/projects/hooks/use-tasks";
import { useUpdateTaskStatus } from "@/features/projects/hooks/task-mutations";
import { TaskBoard } from "@/features/projects/components/board/task-board";
import { NewTaskDialog } from "@/features/projects/components/board/new-task-dialog";
import type { TaskStatus } from "@/features/projects/types/project";

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const membership = useActiveOrganization();
  const tasksQuery = useTasks(projectId);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const updateStatus = useUpdateTaskStatus(projectId ?? "");

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();

    for (const task of tasksQuery.data ?? []) {
      if (task.assigneeName) {
        names.add(task.assigneeName);
      }
    }

    return Array.from(names).sort();
  }, [tasksQuery.data]);

  if (!membership) {
    return <NoOrganizationState />;
  }

  if (tasksQuery.isError) {
    return <PageError error={tasksQuery.error} onRetry={() => tasksQuery.refetch()} />;
  }

  const canCreateTask = hasPermission(membership, PERMISSIONS.CREATE_TASK);
  const canUpdateTask = hasPermission(membership, PERMISSIONS.UPDATE_TASK);

  function handleMoveTask(taskId: string, status: TaskStatus) {
    updateStatus.mutate({ taskId, status });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Drag tasks between columns to update their status.
        </p>
        {canCreateTask && (
          <Button type="button" onClick={() => setIsNewTaskOpen(true)}>
            <Plus aria-hidden="true" /> New task
          </Button>
        )}
      </div>

      {tasksQuery.isPending ? (
        <PageLoading rows={2} />
      ) : (
        <TaskBoard
          tasks={tasksQuery.data}
          isLoading={false}
          canUpdateTask={canUpdateTask}
          onMoveTask={handleMoveTask}
        />
      )}

      {updateStatus.isError && (
        <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {updateStatus.error.message}
        </p>
      )}

      {canCreateTask && projectId && (
        <NewTaskDialog
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          projectId={projectId}
          assigneeOptions={assigneeOptions}
        />
      )}
    </div>
  );
}
