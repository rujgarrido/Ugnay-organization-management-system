import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCreateOrganization } from "../hooks/organization-mutations";
import { organizationFormSchema, type OrganizationFormInput } from "../schemas/organization-form-schema";
import {
  DEFAULT_ORGANIZATION_TEMPLATE_ID,
  ORGANIZATION_TEMPLATES,
} from "../data/organization-templates";

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrganizationDialog({ open, onClose }: CreateOrganizationDialogProps) {
  const createOrganization = useCreateOrganization();
  const form = useForm<OrganizationFormInput>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      templateId: DEFAULT_ORGANIZATION_TEMPLATE_ID,
    },
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
      className="max-w-lg"
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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Template (optional)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ORGANIZATION_TEMPLATES.map(({ id, label, description, positions, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors outline-none",
                  "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  form.watch("templateId") === id ? "border-ring bg-muted/50" : "hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={id}
                    className="size-3.5 accent-primary"
                    {...form.register("templateId")}
                  />
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">{label}</span>
                </span>
                <span className="text-xs text-muted-foreground">{description}</span>
                <span className="text-xs text-muted-foreground/80">{positions.join(", ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

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