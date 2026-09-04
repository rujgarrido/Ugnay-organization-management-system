import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { useUpdateProfile } from "../hooks/use-update-profile";
import { accountSchema, type AccountInput } from "../schemas/account-schema";

interface AccountFormProps {
  defaultValues: AccountInput;
}

export function AccountForm({ defaultValues }: AccountFormProps) {
  const updateProfile = useUpdateProfile();
  const [isSaved, setIsSaved] = useState(false);
  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });

  // Reset the saved confirmation when the user edits again.
  useEffect(() => {
    const subscription = form.watch(() => setIsSaved(false));
    return () => subscription.unsubscribe();
  }, [form]);

  function handleSubmit(values: AccountInput) {
    updateProfile.mutate(values, { onSuccess: () => setIsSaved(true) });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            autoComplete="given-name"
            aria-invalid={Boolean(form.formState.errors.firstName)}
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            autoComplete="family-name"
            aria-invalid={Boolean(form.formState.errors.lastName)}
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input
          id="account-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {updateProfile.isError && (
        <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(updateProfile.error)}
        </p>
      )}

      {isSaved && updateProfile.isSuccess && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4" aria-hidden="true" /> Profile saved.
        </p>
      )}

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
