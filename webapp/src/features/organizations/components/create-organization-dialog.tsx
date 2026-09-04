import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCreateOrganization } from "../hooks/organization-mutations";
import { organizationFormSchema, type OrganizationFormInput } from "../schemas/organization-form-schema";

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrganizationDialog({ open, onClose }: CreateOrganizationDialogProps) {
  const createOrganization = useCreateOrganization();
  const form = useForm<OrganizationFormInput>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name: "", description: "" },
  });

  function handleSubmit(values: OrganizationFormInput) {
    createOrganization.mutate(values, { onSuccess: () => onClose() });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create organization"
      description="Creates the organization, its default positions, and your President membership in one step."
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            placeholder="e.g. Northwind Collective"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-description">Description</Label>
          <Textarea
            id="org-description"
            placeholder="What does this organization do?"
            aria-invalid={Boolean(form.formState.errors.description)}
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        {createOrganization.isError && (
          <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(createOrganization.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={createOrganization.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createOrganization.isPending}>
            {createOrganization.isPending ? "Creating..." : "Create organization"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
