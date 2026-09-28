import { cn } from "@/lib/utils";
import { UgnayMark } from "./ugnay-mark";

export interface UgnayLoaderProps {
  /** Copy shown below the mark. Defaults to "Loading your workspace…" */
  label?: string;
  /** Sub-hint shown below the label, e.g. "Work in sync" */
  hint?: string;
  /** Layout mode: full screen viewport vs contained in page/card */
  variant?: "screen" | "inline";
  className?: string;
}

/**
 * Ugnay-branded loader.
 * Integrates the logo mark with an ambient gradient ring, an indeterminate
 * brand progress track (Primary -> Accent), and calm, accessible status text.
 */
export function UgnayLoader({
  label = "Loading your workspace…",
  hint = "Bringing the moving parts together",
  variant = "inline",
  className,
}: UgnayLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center select-none",
        variant === "screen" ? "min-h-screen w-full bg-background px-4" : "py-12 w-full",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient pulsing glow behind the mark */}
        <div
          aria-hidden="true"
          className="absolute size-16 rounded-full bg-primary/15 blur-lg motion-safe:animate-pulse"
        />

        {/* Breathing aura ring */}
        <div
          aria-hidden="true"
          className="absolute size-14 rounded-full border border-primary/25 motion-safe:animate-ping opacity-60"
          style={{ animationDuration: "2.4s" }}
        />

        {/* Ugnay Mark */}
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-card p-2 shadow-xs ring-1 ring-border">
          <UgnayMark className="size-8" />
        </div>
      </div>

      {/* Copy block */}
      <div className="space-y-1">
        <p className="text-sm font-medium tracking-tight text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      {/* Indeterminate brand loading bar */}
      <div
        aria-hidden="true"
        className="relative h-1 w-32 overflow-hidden rounded-full bg-secondary"
      >
        <div className="absolute inset-y-0 w-1/2 rounded-full bg-linear-to-r from-primary to-accent motion-safe:animate-[ugnay-bar_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Screen-reader accessible announcement */}
      <span className="sr-only">{label}</span>
    </div>
  );
}
