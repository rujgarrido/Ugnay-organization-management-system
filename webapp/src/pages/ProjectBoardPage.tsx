import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { NoOrganizationState } from "@/components/no-organization-state";
import { Button } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useMembers } from "@/features/organizations/hooks/use-members";
import { useTasks } from "@/features/projects/hooks/use-tasks";
import { useUpdateTaskStatus } from "@/features/projects/hooks/task-mutations";
import { TaskBoard } from "@/features/projects/components/board/task-board";
import { NewTaskDialog } from "@/features/projects/components/board/new-task-dialog";
import type { TaskStatus } from "@/features/projects/types/project";
import { getApiErrorMessage } from "@/lib/api-error";

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const membership = useActiveOrganization();
  const orgId = membership?.organization.id ?? null;
  const tasksQuery = useTasks(orgId, projectId);
  const membersQuery = useMembers(orgId);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const updateStatus = useUpdateTaskStatus(orgId ?? "", projectId ?? "");

  const assigneeOptions = useMemo(
    () =>
      (membersQuery.data ?? [])
        .filter((member) => member.isActive)
        .map((member) => ({ id: member.id, name: member.name })),
    [membersQuery.data],
  );

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
          {getApiErrorMessage(updateStatus.error)}
        </p>
      )}

      {canCreateTask && projectId && (
        <NewTaskDialog
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          orgId={orgId ?? ""}
          projectId={projectId}
          assigneeOptions={assigneeOptions}
        />
      )}
    </div>
  );
}
