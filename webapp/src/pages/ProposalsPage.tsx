import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageError, PageLoading } from "@/components/page-state";
import { NoOrganizationState } from "@/components/no-organization-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProposals } from "@/features/proposals/hooks/use-proposals";
import { useCreateProposal } from "@/features/proposals/hooks/proposal-mutations";
import { PROPOSAL_STATUS_LABELS } from "@/features/proposals/types/proposal";
import { proposalFormSchema, type ProposalFormInput } from "@/features/proposals/schemas/proposal-schema";
import { getApiErrorMessage } from "@/lib/api-error";

function NewProposalDialog({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId: string }) {
  const createProposal = useCreateProposal(orgId);
  const form = useForm<ProposalFormInput>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: { title: "", description: "" },
  });

  function handleSubmit(values: ProposalFormInput) {
    createProposal.mutate(values, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="New proposal" description="New proposals start as drafts.">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proposal-title">Title</Label>
          <Input
            id="proposal-title"
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-description">Description</Label>
          <Textarea id="proposal-description" {...form.register("description")} />
        </div>

        {createProposal.isError && (
          <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(createProposal.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={createProposal.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProposal.isPending}>
            {createProposal.isPending ? "Creating..." : "Create proposal"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ProposalsPage() {
  const membership = useActiveOrganization();
  const proposalsQuery = useProposals(membership?.organization.id ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!membership) {
    return <NoOrganizationState />;
  }

  const canCreateProposal = hasPermission(membership, PERMISSIONS.CREATE_PROPOSAL);
  const proposals = proposalsQuery.data;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Proposals</h1>
          <p className="text-sm text-muted-foreground">Track proposals from draft to sign-off.</p>
        </div>
        {canCreateProposal && (
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" /> New proposal
          </Button>
        )}
      </header>

      {proposalsQuery.isError ? (
        <PageError error={proposalsQuery.error} onRetry={() => proposalsQuery.refetch()} />
      ) : proposalsQuery.isPending ? (
        <PageLoading rows={4} />
      ) : proposals && proposals.length > 0 ? (
        <ul className="space-y-3">
          {proposals.map((proposal) => (
            <li key={proposal.id}>
              <Link
                to={`/proposals/${proposal.id}/status`}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Open ${proposal.title}`}
              >
                <Card size="sm" className="transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardTitle className="truncate">{proposal.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{proposal.description ?? "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={proposal.status === "rejected" ? "destructive" : "secondary"}>
                      {PROPOSAL_STATUS_LABELS[proposal.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
          <FileText className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No proposals yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Create a proposal to start the approval workflow.</p>
        </div>
      )}

      {canCreateProposal && (
        <NewProposalDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} orgId={membership.organization.id} />
      )}
    </div>
  );
}
