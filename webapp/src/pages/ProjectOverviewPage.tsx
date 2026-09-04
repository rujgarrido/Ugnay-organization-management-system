import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, CheckCircle2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageError, PageLoading } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProject } from "@/features/projects/hooks/use-project";
import { useArchiveProject, useUpdateProject } from "@/features/projects/hooks/project-mutations";
import { projectFormSchema, type ProjectFormInput } from "@/features/projects/schemas/project-schema";
import { getApiErrorMessage } from "@/lib/api-error";

export function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const membership = useActiveOrganization();
  const projectQuery = useProject(membership?.organization.id ?? null, projectId);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const updateProject = useUpdateProject(membership?.organization.id ?? "", projectId ?? "");
  const archiveProject = useArchiveProject(membership?.organization.id ?? "", projectId ?? "");

  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (projectQuery.data) {
      form.reset({
        name: projectQuery.data.name,
        description: projectQuery.data.description ?? "",
      });
    }
  }, [projectQuery.data, form]);

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
  const canUpdate = hasPermission(membership, PERMISSIONS.UPDATE_PROJECT);
  const canArchive = hasPermission(membership, PERMISSIONS.ARCHIVE_PROJECT);
  const isArchived = project.status === "archived";

  function handleSave(values: ProjectFormInput) {
    updateProject.mutate(values, { onSuccess: () => setIsSaved(true) });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Project metadata and lifecycle management.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="overview-name">Name</Label>
              <Input
                id="overview-name"
                disabled={!canUpdate || isArchived}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview-description">Description</Label>
              <Textarea
                id="overview-description"
                disabled={!canUpdate || isArchived}
                {...form.register("description")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isArchived ? "outline" : "secondary"}>
                {isArchived ? "Archived" : "Active"}
              </Badge>
              {isSaved && updateProject.isSuccess && (
                <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4" aria-hidden="true" /> Saved.
                </p>
              )}
            </div>

            {updateProject.isError && (
              <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {getApiErrorMessage(updateProject.error)}
              </p>
            )}

            {canUpdate && !isArchived && (
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {canArchive && !isArchived && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Archiving is soft: the project stays visible and is never deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsArchiveOpen(true)}
              disabled={archiveProject.isPending}
            >
              <Archive aria-hidden="true" /> Archive project
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={() => archiveProject.mutate(undefined, { onSuccess: () => setIsArchiveOpen(false) })}
        title={`Archive ${project.name}?`}
        description="The project will be marked as archived. You can still find it in the projects list."
        confirmLabel="Archive project"
        isDestructive
        isPending={archiveProject.isPending}
      />
    </div>
  );
}
