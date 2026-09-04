import { ShieldAlert } from "lucide-react";
import { PageError, PageLoading } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, PERMISSIONS } from "@/features/organizations/types";
import { useActiveOrganization } from "@/features/organizations/hooks/use-active-organization";
import { usePositions } from "@/features/organizations/hooks/use-positions";

export function OrganizationPositionsPage() {
  const membership = useActiveOrganization();
  const positionsQuery = usePositions(membership?.organization.id ?? null);

  if (!membership) {
    return null;
  }

  if (positionsQuery.isError) {
    return <PageError error={positionsQuery.error} onRetry={() => positionsQuery.refetch()} />;
  }

  // Spec US-2.7 (MVP): read-only view, gated behind MANAGE_POSITIONS.
  const canView = hasPermission(membership, PERMISSIONS.MANAGE_POSITIONS);

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
        <ShieldAlert className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Permission required</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Only members who can manage positions can view this page.
        </p>
      </div>
    );
  }

  const positions = positionsQuery.data;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Read-only view of each position and its permission codes.</p>

      {positionsQuery.isPending ? (
        <PageLoading rows={4} />
      ) : positions && positions.length > 0 ? (
        <ul className="space-y-3">
          {positions.map((position) => (
            <li key={position.id}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{position.name}</CardTitle>
                  <CardDescription>{position.description ?? "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-1.5" aria-label={`Permissions for ${position.name}`}>
                    {position.permissions.map((permission) => (
                      <li key={permission}>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {permission}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          No positions defined.
        </p>
      )}
    </div>
  );
}
