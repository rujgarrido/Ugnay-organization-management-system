import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium">Could not load this section</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
