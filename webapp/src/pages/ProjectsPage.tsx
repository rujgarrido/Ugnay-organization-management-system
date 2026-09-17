import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { NoOrganizationState } from "@/components/no-organization-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { NewProjectDialog } from "@/features/projects/components/new-project-dialog";

export function ProjectsPage() {
  const membership = useActiveOrganization();
  const projectsQuery = useProjects(membership?.organization.id ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!membership) {
    return <NoOrganizationState />;
  }

  const canCreateProject = hasPermission(membership, PERMISSIONS.CREATE_PROJECT);
  const projects = projectsQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Projects</h1>
          <p className="text-sm text-muted-foreground">Browse and manage work in {membership.organization.name}.</p>
        </div>
        {canCreateProject && (
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" /> New project
          </Button>
        )}
      </header>

      {projectsQuery.isError ? (
        <PageError error={projectsQuery.error} onRetry={() => projectsQuery.refetch()} />
      ) : projectsQuery.isPending ? (
        <PageLoading rows={4} />
      ) : projects && projects.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}/board`}
                className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Open board for ${project.name}`}
              >
                <Card
                  size="sm"
                  className={
                    project.status === "archived"
                      ? "h-full opacity-70 transition-colors hover:opacity-100"
                      : "h-full transition-colors hover:bg-muted/40"
                  }
                >
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">
                      {project.description ?? "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={project.status === "archived" ? "outline" : "secondary"}>
                      {project.status === "archived" ? "Archived" : "Active"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
          <FolderKanban className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {canCreateProject
              ? "Create your first project to start planning work."
              : "Ask an admin to create the first project."}
          </p>
        </div>
      )}

      {canCreateProject && (
        <NewProjectDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} orgId={membership.organization.id} />
      )}
    </div>
  );
}


