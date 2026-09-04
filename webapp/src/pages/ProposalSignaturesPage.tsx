import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useSignatures } from "@/features/proposals/hooks/use-signatures";
import { useAddSignature, useCompleteSignature } from "@/features/proposals/hooks/signature-mutations";
import { signatureFormSchema, type SignatureFormInput } from "@/features/proposals/schemas/signature-schema";
import { getApiErrorMessage } from "@/lib/api-error";

export function ProposalSignaturesPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const membership = useActiveOrganization();
  const signaturesQuery = useSignatures(proposalId);
  const addSignature = useAddSignature(proposalId ?? "");
  const completeSignature = useCompleteSignature(proposalId ?? "");

  const form = useForm<SignatureFormInput>({
    resolver: zodResolver(signatureFormSchema),
    defaultValues: { signatoryName: "", role: "" },
  });

  if (!membership) {
    return null;
  }

  if (signaturesQuery.isError) {
    return <PageError error={signaturesQuery.error} onRetry={() => signaturesQuery.refetch()} />;
  }

  const canManageSignatures = hasPermission(membership, PERMISSIONS.UPDATE_PROPOSAL);
  const signatures = signaturesQuery.data;

  function handleAdd(values: SignatureFormInput) {
    addSignature.mutate(values, { onSuccess: () => form.reset() });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
          <CardDescription>Sign-off checklist from required signatories.</CardDescription>
        </CardHeader>
        <CardContent>
          {signaturesQuery.isPending ? (
            <PageLoading rows={2} />
          ) : signatures && signatures.length > 0 ? (
            <ul className="divide-y">
              {signatures.map((signature) => (
                <li key={signature.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {signature.isComplete ? (
                    <CheckCircle2 className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{signature.signatoryName}</p>
                    <p className="truncate text-xs text-muted-foreground">{signature.role}</p>
                  </div>
                  <Badge variant={signature.isComplete ? "secondary" : "outline"}>
                    {signature.isComplete ? "Complete" : "Pending"}
                  </Badge>
                  {canManageSignatures && !signature.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => completeSignature.mutate(signature.id)}
                      disabled={completeSignature.isPending}
                    >
                      Mark complete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
              No signatories yet.
            </p>
          )}

          {completeSignature.isError && (
            <p role="alert" className="mt-3 rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(completeSignature.error)}
            </p>
          )}
        </CardContent>
      </Card>

      {canManageSignatures && (
        <Card>
          <CardHeader>
            <CardTitle>Add signatory</CardTitle>
            <CardDescription>Add someone who needs to sign off on this proposal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signatory-name">Name</Label>
                  <Input
                    id="signatory-name"
                    aria-invalid={Boolean(form.formState.errors.signatoryName)}
                    {...form.register("signatoryName")}
                  />
                  {form.formState.errors.signatoryName && (
                    <p className="text-sm text-destructive">{form.formState.errors.signatoryName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signatory-role">Role</Label>
                  <Input
                    id="signatory-role"
                    placeholder="e.g. Treasurer"
                    aria-invalid={Boolean(form.formState.errors.role)}
                    {...form.register("role")}
                  />
                  {form.formState.errors.role && (
                    <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                  )}
                </div>
              </div>

              {addSignature.isError && (
                <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {getApiErrorMessage(addSignature.error)}
                </p>
              )}

              <Button type="submit" disabled={addSignature.isPending}>
                {addSignature.isPending ? "Adding..." : "Add signatory"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
