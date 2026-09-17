import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "../../types/project";
import { TaskCard } from "./task-card";
interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  canDrag: boolean;
}
function BoardColumn({ status, tasks, canDrag }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section aria-label={TASK_STATUS_LABELS[status]} className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/50 p-3">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {TASK_STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-muted-foreground" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </header>
      <ul
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg",
          isOver && "ring-2 ring-ring/50",
        )}
      >
        {tasks.length === 0 ? (
          <li className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            No tasks
          </li>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} canDrag={canDrag} />)
        )}
      </ul>
    </section>
  );
}
function BoardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-busy="true">
      {TASK_STATUSES.map((status) => (
        <div key={status} className="space-y-2 rounded-xl bg-muted/50 p-3" aria-hidden="true">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
interface TaskBoardProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  canUpdateTask: boolean;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}
type AssignmentFilter = "all" | "assigned" | "unassigned";
export function TaskBoard({ tasks, isLoading, canUpdateTask, onMoveTask }: TaskBoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    if (assignmentFilter === "assigned") {
      return tasks.filter((task) => task.assigneeName !== null);
    }
    if (assignmentFilter === "unassigned") {
      return tasks.filter((task) => task.assigneeName === null);
    }
    return tasks;
  }, [tasks, assignmentFilter]);
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>();
    for (const status of TASK_STATUSES) {
      grouped.set(status, []);
    }
    for (const task of visibleTasks) {
      grouped.get(task.status)?.push(task);
    }
    return grouped;
  }, [visibleTasks]);
  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }
  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const overId = event.over?.id;
    if (!overId || !canUpdateTask) return;
    const nextStatus = String(overId) as TaskStatus;
    const task = tasks?.find((candidate) => candidate.id === event.active.id);
    if (task && task.status !== nextStatus) {
      onMoveTask(task.id, nextStatus);
    }
  }
  if (isLoading) {
    return <BoardSkeleton />;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="board-assignee-filter" className="text-sm text-muted-foreground">
          Assignee
        </label>
        <select
          id="board-assignee-filter"
          value={assignmentFilter}
          onChange={(event) => setAssignmentFilter(event.target.value as AssignmentFilter)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">Everyone</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 overflow-x-auto pb-2 sm:grid-cols-2 xl:grid-cols-5">
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={tasksByStatus.get(status) ?? []}
              canDrag={canUpdateTask}
            />
          ))}
        </div>
      </DndContext>
      {activeTaskId && <span className="sr-only" aria-live="polite">Dragging a task</span>}
    </div>
  );
}
