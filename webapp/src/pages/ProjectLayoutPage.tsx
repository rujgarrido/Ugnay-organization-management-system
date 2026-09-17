import { Outlet, useParams } from "react-router-dom";
import { PageError, PageLoading } from "@/components/page-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RouteTabs } from "@/components/route-tabs";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProject } from "@/features/projects/hooks/use-project";

/** Project sub-nav shell: breadcrumbs + Board/Overview tabs (spec US-3.3). */
export function ProjectLayoutPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const membership = useActiveOrganization();
  const projectQuery = useProject(membership?.organization.id ?? null, projectId);

  if (!membership) {
    return null;
  }

  if (projectQuery.isError) {
    return <PageError error={projectQuery.error} onRetry={() => projectQuery.refetch()} />;
  }

  if (projectQuery.isPending || !projectQuery.data) {
    return <PageLoading rows={2} />;
  }

  const project = projectQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projects", to: "/projects" },
          { label: project.name },
        ]}
      />

      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.description ?? "No description"}</p>
      </header>

      <RouteTabs
        ariaLabel="Project sections"
        tabs={[
          { to: `/projects/${projectId}/board`, label: "Board" },
          { to: `/projects/${projectId}/overview`, label: "Overview" },
        ]}
      />

      <Outlet />
    </div>
  );
}
