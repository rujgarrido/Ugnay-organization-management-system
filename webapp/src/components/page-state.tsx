import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      {/* Header skeleton with a soft Ugnay brand tint */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg bg-primary/10" aria-hidden="true" />
        <Skeleton className="h-4 w-72 rounded-md bg-muted" aria-hidden="true" />
      </div>

      {/* Row skeletons */}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" aria-hidden="true" />
        ))}
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

interface PageErrorProps {
  error: unknown;
  onRetry: () => void;
}

export function PageError({ error, onRetry }: PageErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium">Could not load this page</p>
      <p className="max-w-sm text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
      <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
