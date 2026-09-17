import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS } from "../types";
import type { Member } from "../types/member";
import type { PositionWithPermissions } from "../types/position";

interface MembersTableProps {
  members: Member[];
  positions: PositionWithPermissions[];
  canManage: boolean;
  onUpdatePosition: (member: Member, positionId: string) => void;
  onDeactivateRequest: (member: Member) => void;
}

export function MembersTable({
  members,
  positions,
  canManage,
  onUpdatePosition,
  onDeactivateRequest,
}: MembersTableProps) {
  const activeAdminCount = members.filter(
    (member) => member.isActive && member.permissions.includes(PERMISSIONS.MANAGE_MEMBERS),
  ).length;

  const isLastAdmin = (member: Member) =>
    member.isActive &&
    member.permissions.includes(PERMISSIONS.MANAGE_MEMBERS) &&
    activeAdminCount <= 1;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Status</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const lastAdmin = isLastAdmin(member);

          return (
            <TableRow key={member.id} className={member.isActive ? undefined : "opacity-60"}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell className="text-muted-foreground">{member.email}</TableCell>
              <TableCell>
                <select
                  aria-label={`Position for ${member.name}`}
                  value={member.position.id}
                  disabled={!canManage || lastAdmin}
                  title={lastAdmin ? "The last remaining admin cannot be demoted" : undefined}
                  onChange={(event) => onUpdatePosition(member, event.target.value)}
                  className="h-8 w-full min-w-36 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <Badge variant={member.isActive ? "secondary" : "outline"}>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!member.isActive || lastAdmin}
                    title={
                      !member.isActive
                        ? "Member is already inactive"
                        : lastAdmin
                          ? "The last remaining admin cannot be deactivated"
                          : undefined
                    }
                    onClick={() => onDeactivateRequest(member)}
                  >
                    <Archive aria-hidden="true" /> Deactivate
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
