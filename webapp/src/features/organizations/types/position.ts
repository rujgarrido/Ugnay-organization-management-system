import type { PermissionCode, Position } from "./organization";

export interface PositionWithPermissions extends Position {
  permissions: PermissionCode[];
}
