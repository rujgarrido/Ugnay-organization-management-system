import { useEffect, useState } from "react";
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
import { useOrganization } from "@/features/organizations/hooks/use-organization";
import { useArchiveOrganization, useUpdateOrganization } from "@/features/organizations/hooks/organization-mutations";
import { organizationFormSchema, type OrganizationFormInput } from "@/features/organizations/schemas/organization-form-schema";
import { getApiErrorMessage } from "@/lib/api-error";

export function OrganizationProfilePage() {
  const membership = useActiveOrganization();
  const orgQuery = useOrganization(membership?.organization.id ?? null);
  const updateOrganization = useUpdateOrganization(membership?.organization.id ?? "");
  const archiveOrganization = useArchiveOrganization(membership?.organization.id ?? "");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<OrganizationFormInput>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (orgQuery.data) {
      form.reset({ name: orgQuery.data.name, description: orgQuery.data.description ?? "" });
    }
  }, [orgQuery.data, form]);

  if (!membership) {
    return null;
  }

  if (orgQuery.isError) {
    return <PageError error={orgQuery.error} onRetry={() => orgQuery.refetch()} />;
  }

  if (orgQuery.isPending || !orgQuery.data) {
    return <PageLoading rows={2} />;
  }

  const organization = orgQuery.data;
  // Admin-level proxy permission for org profile management (no dedicated
  // MANAGE_ORGANIZATION code exists in the seeded permission set).
  const canManageOrg = hasPermission(membership, PERMISSIONS.MANAGE_MEMBERS);
  const isArchived = organization.status === "archived";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Public name and description of the organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => updateOrganization.mutate(values, { onSuccess: () => setIsSaved(true) }))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="org-profile-name">Name</Label>
              <Input
                id="org-profile-name"
                disabled={!canManageOrg || isArchived}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-profile-description">Description</Label>
              <Textarea
                id="org-profile-description"
                disabled={!canManageOrg || isArchived}
                {...form.register("description")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isArchived ? "outline" : "secondary"}>
                {isArchived ? "Archived" : "Active"}
              </Badge>
              {isSaved && updateOrganization.isSuccess && (
                <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4" aria-hidden="true" /> Saved.
                </p>
              )}
            </div>

            {updateOrganization.isError && (
              <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {getApiErrorMessage(updateOrganization.error)}
              </p>
            )}

            {canManageOrg && !isArchived && (
              <Button type="submit" disabled={updateOrganization.isPending}>
                {updateOrganization.isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {canManageOrg && !isArchived && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Deactivate the organization without deleting any data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={() => setIsArchiveOpen(true)}>
              <Archive aria-hidden="true" /> Archive organization
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={() => archiveOrganization.mutate(undefined, { onSuccess: () => setIsArchiveOpen(false) })}
        title={`Archive ${organization.name}?`}
        description="The organization will be deactivated for everyone. Nothing is deleted."
        confirmLabel="Archive organization"
        isDestructive
        isPending={archiveOrganization.isPending}
      />
    </div>
  );
}
