import type { PermissionCode, Position } from "./organization";

export interface Member {
  id: string;
  name: string;
  email: string;
  position: Position;
  permissions: PermissionCode[];
  isActive: boolean;
  joinedAt: string;
}
