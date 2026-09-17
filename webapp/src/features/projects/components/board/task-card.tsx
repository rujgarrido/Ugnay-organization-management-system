import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, type Task } from "../../types/project";

interface TaskCardProps {
  task: Task;
  canDrag: boolean;
}

export function TaskCard({ task, canDrag }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-roledescription="Draggable task"
      aria-label={`${task.title}, ${TASK_PRIORITY_LABELS[task.priority]} priority, ${task.assigneeName ?? "unassigned"}`}
      className={cn(
        "touch-none rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        canDrag ? "cursor-grab hover:shadow-md active:cursor-grabbing" : "cursor-default",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge
          variant={task.priority === "high" ? "destructive" : "secondary"}
          className="shrink-0"
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        <span className="truncate text-xs text-muted-foreground">
          {task.assigneeName ?? "Unassigned"}
        </span>
      </div>
    </li>
  );
}
