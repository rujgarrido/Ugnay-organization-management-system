import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import type {
  ActivityEntityType,
  ActivityEntityTypeFilter,
  ActivityPage,
} from "../types/dashboard";
import { formatRelativeTime } from "../utils/format-relative-time";
import { DashboardErrorState } from "./dashboard-error-state";

const ENTITY_TYPE_LABELS: Record<ActivityEntityType, string> = {
  organization: "Organization",
  project: "Project",
  task: "Task",
  member: "Member",
};

const FILTER_OPTIONS: Array<{ value: ActivityEntityTypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "task", label: "Tasks" },
  { value: "project", label: "Projects" },
  { value: "member", label: "Members" },
  { value: "organization", label: "Organization" },
];

interface ActivityFeedProps {
  activity: ActivityPage | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  page: number;
  entityType: ActivityEntityTypeFilter;
  onPageChange: (page: number) => void;
  onEntityTypeChange: (entityType: ActivityEntityTypeFilter) => void;
  onRetry: () => void;
}

export function ActivityFeed({
  activity,
  isLoading,
  isError,
  errorMessage,
  page,
  entityType,
  onPageChange,
  onEntityTypeChange,
  onRetry,
}: ActivityFeedProps) {
  const hasItems = activity !== undefined && activity.items.length > 0;
  const emptyTitle = entityType === "all" ? "No activity yet" : "No activity of this type yet";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>What your team has been working on, most recent first.</CardDescription>
        <CardAction>
          <div>
            <label htmlFor="activity-type-filter" className="sr-only">
              Filter activity by type
            </label>
            <select
              id="activity-type-filter"
              value={entityType}
              onChange={(event) => onEntityTypeChange(event.target.value as ActivityEntityTypeFilter)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ol className="space-y-4" aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="flex items-start gap-3" aria-hidden="true">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </li>
            ))}
          </ol>
        ) : isError ? (
          <DashboardErrorState
            message={errorMessage ?? "Something went wrong. Please try again."}
            onRetry={onRetry}
          />
        ) : hasItems && activity ? (
          <ol className="divide-y">
            {activity.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {getInitials(item.actorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{item.actorName}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.entityName}</span>
                  </p>
                  <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </time>
                </div>
                <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                  {ENTITY_TYPE_LABELS[item.entityType]}
                </Badge>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-6 py-10 text-center">
            <Activity className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {entityType === "all"
                ? "When your team works on projects and tasks, the latest updates will show up here."
                : "Try a different activity type to see more results."}
            </p>
          </div>
        )}
      </CardContent>
      {!isLoading && !isError && activity && activity.totalPages > 1 && (
        <CardFooter className="justify-between">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Page {activity.page} of {activity.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= activity.totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
