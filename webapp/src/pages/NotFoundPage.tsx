import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link className="font-medium underline underline-offset-4" to="/">Return home</Link>
    </main>
  );
}