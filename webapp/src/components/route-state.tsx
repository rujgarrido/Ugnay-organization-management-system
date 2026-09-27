import { UgnayLoader } from "@/components/brand/ugnay-loader";

export function RouteLoading() {
  return (
    <UgnayLoader
      variant="screen"
      label="Loading your workspace…"
      hint="Connecting your team’s progress"
    />
  );
}
