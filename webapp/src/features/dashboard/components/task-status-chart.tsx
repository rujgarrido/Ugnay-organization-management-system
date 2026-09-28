import { ListTodo } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/features/projects/types/project";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "../types/dashboard";

/**
 * Slice colors come from the shared chart tokens (`--chart-1..5` in index.css)
 * so the card follows the theme in both light and dark mode. `sector` lands on
 * the donut slice, `dot` on the matching legend swatch.
 */
const STATUS_STYLES: Record<TaskStatus, { sector: string; dot: string }> = {
  backlog: { sector: "fill-chart-5", dot: "bg-chart-5" },
  todo: { sector: "fill-chart-3", dot: "bg-chart-3" },
  in_progress: { sector: "fill-chart-1", dot: "bg-chart-1" },
  review: { sector: "fill-chart-2", dot: "bg-chart-2" },
  done: { sector: "fill-chart-4", dot: "bg-chart-4" },
};

interface TaskStatusChartProps {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
}

export function TaskStatusChart({ overview, isLoading }: TaskStatusChartProps) {
  const slices = TASK_STATUSES.map((status) => ({
    status,
    name: TASK_STATUS_LABELS[status],
    value: overview?.tasksByStatus?.[status] ?? 0,
    // Recharts spreads each data entry onto its own sector, so the fill utility
    // travels with the slice instead of a separate (deprecated) <Cell>.
    className: STATUS_STYLES[status].sector,
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card aria-busy={isLoading}>
      <CardHeader>
        <CardTitle>Task status distribution</CardTitle>
        <CardDescription>Every task in the organization, grouped by status.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TaskStatusChartSkeleton />
        ) : total === 0 ? (
          <TaskStatusChartEmptyState />
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div
              role="img"
              aria-label={`Task status distribution: ${slices
                .map((slice) => `${slice.name} ${slice.value}`)
                .join(", ")}`}
              className="relative size-40 shrink-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices.filter((slice) => slice.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="64%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke="none"
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl font-semibold tabular-nums">{total}</span>
                <span className="text-xs text-muted-foreground">
                  {total === 1 ? "task" : "tasks"}
                </span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-2">
              {slices.map((slice) => (
                <li key={slice.status} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn("size-2.5 shrink-0 rounded-full", STATUS_STYLES[slice.status].dot)}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-muted-foreground">{slice.name}</span>
                  <span className="font-medium tabular-nums">{slice.value}</span>
                  <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {Math.round((slice.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskStatusChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row" aria-hidden="true">
      <Skeleton className="size-40 shrink-0 rounded-full" />
      <div className="w-full flex-1 space-y-3">
        {TASK_STATUSES.map((status) => (
          <Skeleton key={status} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function TaskStatusChartEmptyState() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-6 py-10 text-center">
      <ListTodo className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">No tasks yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Task statuses show up here once your team adds work to a project.
      </p>
    </div>
  );
}
