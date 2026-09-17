import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-xl" aria-hidden="true" />
      ))}
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
