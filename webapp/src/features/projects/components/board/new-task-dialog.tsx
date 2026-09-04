import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "../../types/project";
import { useCreateTask } from "../../hooks/task-mutations";
import { taskFormSchema, type TaskFormInput } from "../../schemas/task-schema";

interface NewTaskDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  assigneeOptions: string[];
}

export function NewTaskDialog({ open, onClose, projectId, assigneeOptions }: NewTaskDialogProps) {
  const createTask = useCreateTask(projectId);
  const form = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: "", description: "", priority: "medium", assigneeName: "", dueDate: "" },
  });

  function handleSubmit(values: TaskFormInput) {
    createTask.mutate(values, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="New task" description="New tasks start in Backlog.">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            placeholder="e.g. Draft the launch announcement"
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea id="task-description" {...form.register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...form.register("priority")}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {TASK_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assignee</Label>
            <select
              id="task-assignee"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...form.register("assigneeName")}
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-due-date">Due date</Label>
          <Input id="task-due-date" type="date" {...form.register("dueDate")} />
          {form.formState.errors.dueDate && (
            <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
          )}
        </div>

        {createTask.isError && (
          <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(createTask.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={createTask.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? "Creating..." : "Create task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
