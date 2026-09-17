import { useState } from "react";
import { Users } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoOrganizationState } from "@/components/no-organization-state";
import { PageError, PageLoading } from "@/components/page-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, PERMISSIONS, type Member } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { useMembers } from "@/features/organizations/hooks/use-members";
import { usePositions } from "@/features/organizations/hooks/use-positions";
import { useDeactivateMember, useUpdateMemberPosition } from "@/features/organizations/hooks/member-mutations";
import { AddMemberForm } from "@/features/organizations/components/add-member-form";
import { MembersTable } from "@/features/organizations/components/members-table";
import { getApiErrorMessage } from "@/lib/api-error";

export function MembersPage() {
  const membership = useActiveOrganization();
  const orgId = membership?.organization.id ?? null;
  const membersQuery = useMembers(orgId);
  const positionsQuery = usePositions(orgId);
  const updatePosition = useUpdateMemberPosition(orgId ?? "");
  const deactivateMember = useDeactivateMember(orgId ?? "");
  const [deactivateTarget, setDeactivateTarget] = useState<Member | null>(null);

  if (!membership) {
    return <NoOrganizationState />;
  }

  if (membersQuery.isError) {
    return <PageError error={membersQuery.error} onRetry={() => membersQuery.refetch()} />;
  }

  const canManage = hasPermission(membership, PERMISSIONS.MANAGE_MEMBERS);
  const members = membersQuery.data;
  const positions = positionsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Members</h1>
        <p className="text-sm text-muted-foreground">Manage membership and positions in {membership.organization.name}.</p>
      </header>

      {canManage && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Add member</CardTitle>
            <CardDescription>Adds an already-registered user immediately — no email invite.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddMemberForm orgId={membership.organization.id} positions={positions} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization members</CardTitle>
          <CardDescription>Change a position or deactivate a member. The last remaining admin is protected.</CardDescription>
        </CardHeader>
        <CardContent>
          {membersQuery.isPending ? (
            <PageLoading rows={4} />
          ) : members && members.length > 0 ? (
            <MembersTable
              members={members}
              positions={positions}
              canManage={canManage}
              onUpdatePosition={(member, positionId) => updatePosition.mutate({ memberId: member.id, positionId })}
              onDeactivateRequest={setDeactivateTarget}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
              <Users className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No members yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">Add your first member to start collaborating.</p>
            </div>
          )}

          {(updatePosition.isError || deactivateMember.isError) && (
            <p role="alert" className="mt-3 rounded-lg border-l-3 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(updatePosition.error ?? deactivateMember.error)}
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            deactivateMember.mutate(deactivateTarget.id, {
              onSettled: () => setDeactivateTarget(null),
            });
          }
        }}
        title={`Deactivate ${deactivateTarget?.name ?? "member"}?`}
        description="Deactivation is soft: the member keeps their history and can be re-activated later."
        confirmLabel="Deactivate"
        isDestructive
        isPending={deactivateMember.isPending}
      />

    </div>
  );
}


