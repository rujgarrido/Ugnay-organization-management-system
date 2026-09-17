import { AlarmClock, CircleCheck, FolderKanban, ListTodo, type LucideIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "../types/dashboard";

interface MetricDefinition {
  key: keyof DashboardOverview;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Metrics flagged as warning render destructive when the value is above zero. */
  tone?: "warning";
}

const METRICS: MetricDefinition[] = [
  { key: "activeProjects", label: "Active projects", hint: "Currently in progress", icon: FolderKanban },
  { key: "openTasks", label: "Open tasks", hint: "Awaiting completion", icon: ListTodo },
  { key: "overdueTasks", label: "Overdue tasks", hint: "Need attention", icon: AlarmClock, tone: "warning" },
  { key: "completedTasks", label: "Completed tasks", hint: "All time", icon: CircleCheck },
];

interface DashboardSummaryCardsProps {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
}

export function DashboardSummaryCards({ overview, isLoading }: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy={isLoading}>
      {isLoading
        ? METRICS.map((metric) => (
            <Card key={metric.key} size="sm" aria-hidden="true">
              <CardHeader>
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3.5 w-32" />
              </CardContent>
            </Card>
          ))
        : METRICS.map((metric) => {
            const value = overview?.[metric.key] ?? 0;
            const Icon = metric.icon;

            return (
              <Card key={metric.key} size="sm">
                <CardHeader>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardAction>
                    <span
                      className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p
                    className={cn(
                      "font-heading text-2xl font-semibold tabular-nums",
                      metric.tone === "warning" && value > 0 && "text-destructive",
                    )}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.hint}</p>
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}

