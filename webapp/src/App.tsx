import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import { AppErrorBoundary } from "@/components/app-error-boundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  );
}