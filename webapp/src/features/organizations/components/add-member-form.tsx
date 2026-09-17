import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PositionWithPermissions } from "../types/position";
import { useAddMember } from "../hooks/member-mutations";
import { addMemberSchema, type AddMemberInput } from "../schemas/add-member-schema";

interface AddMemberFormProps {
  orgId: string;
  positions: PositionWithPermissions[];
}

export function AddMemberForm({ orgId, positions }: AddMemberFormProps) {
  const addMember = useAddMember(orgId);
  const form = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "", positionId: "" },
  });

  function handleSubmit(values: AddMemberInput) {
    addMember.mutate(values, {
      onSuccess: () => form.reset({ email: "", positionId: "" }),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <Label htmlFor="member-email">Email</Label>
          <Input
            id="member-email"
            type="email"
            placeholder="registered.user@company.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-position">Position</Label>
          <select
            id="member-position"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-invalid={Boolean(form.formState.errors.positionId)}
            {...form.register("positionId")}
          >
            <option value="">Select a position</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
          {form.formState.errors.positionId && (
            <p className="text-sm text-destructive">{form.formState.errors.positionId.message}</p>
          )}
        </div>
      </div>

      {addMember.isError && (
        <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(addMember.error)}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={addMember.isPending}>
          {addMember.isPending ? "Adding..." : "Add member"}
        </Button>
      </div>
    </form>
  );
}
