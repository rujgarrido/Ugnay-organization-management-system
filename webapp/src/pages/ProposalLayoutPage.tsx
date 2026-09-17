import { Outlet, useParams } from "react-router-dom";
import { PageError, PageLoading } from "@/components/page-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RouteTabs } from "@/components/route-tabs";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useProposal } from "@/features/proposals/hooks/use-proposal";

/** Proposal sub-nav shell: breadcrumbs + Status/Signatures tabs (spec US-5.2/5.3). */
export function ProposalLayoutPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const membership = useActiveOrganization();
  const proposalQuery = useProposal(membership?.organization.id ?? null, proposalId);

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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Proposals", to: "/proposals" },
          { label: proposal.title },
        ]}
      />

      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{proposal.title}</h1>
        <p className="text-sm text-muted-foreground">{proposal.description ?? "No description"}</p>
      </header>

      <RouteTabs
        ariaLabel="Proposal sections"
        tabs={[
          { to: `/proposals/${proposalId}/status`, label: "Status & Details" },
          { to: `/proposals/${proposalId}/signatures`, label: "Signatures" },
        ]}
      />

      <Outlet />
    </div>
  );
}
