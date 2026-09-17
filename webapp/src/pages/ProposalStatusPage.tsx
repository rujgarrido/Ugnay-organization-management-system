import { useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProposal } from "@/features/proposals/hooks/use-proposal";
import { useUpdateProposalStatus } from "@/features/proposals/hooks/proposal-mutations";
import { PROPOSAL_STATUS_LABELS, PROPOSAL_TRANSITIONS } from "@/features/proposals/types/proposal";
import { getApiErrorMessage } from "@/lib/api-error";

export function ProposalStatusPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const membership = useActiveOrganization();
  const proposalQuery = useProposal(membership?.organization.id ?? null, proposalId);

  const updateStatus = useUpdateProposalStatus(membership?.organization.id ?? "", proposalId ?? "");

  if (!membership) {
    return null;
  }

  if (proposalQuery.isError) {
    return <PageError error={proposalQuery.error} onRetry={() => proposalQuery.refetch()} />;
  }

  if (proposalQuery.isPending || !proposalQuery.data) {
    return <PageLoading rows={2} />;
  }

  const proposal = proposalQuery.data;
  const transitions = PROPOSAL_TRANSITIONS[proposal.status];

  // Spec US-5.2: draft -> submitted needs SUBMIT_PROPOSAL, the rest UPDATE_PROPOSAL.
  function requiredPermission(next: (typeof transitions)[number]) {
    return proposal.status === "draft" && next === "submitted"
      ? PERMISSIONS.SUBMIT_PROPOSAL
      : PERMISSIONS.UPDATE_PROPOSAL;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current status</CardTitle>
          <CardDescription>Only legally valid transitions are shown as actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant={proposal.status === "rejected" ? "destructive" : "secondary"} className="text-sm">
            {PROPOSAL_STATUS_LABELS[proposal.status]}
          </Badge>

          {transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This proposal has reached a terminal status. No further transitions are available.
            </p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Move forward to
              </h3>
              <div className="flex flex-wrap gap-2">
                {transitions.map((next) => {
                  const allowed = hasPermission(membership, requiredPermission(next));

                  return (
                    <Button
                      key={next}
                      type="button"
                      variant="outline"
                      disabled={!allowed || updateStatus.isPending}
                      title={allowed ? undefined : "You do not have permission for this action"}
                      onClick={() => updateStatus.mutate(next)}
                    >
                      {PROPOSAL_STATUS_LABELS[next]} <ArrowRight aria-hidden="true" />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {updateStatus.isError && (
            <p role="alert" className="rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(updateStatus.error)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
