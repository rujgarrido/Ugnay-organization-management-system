import type { OrganizationMembership } from "@/features/organizations/types";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  memberships?: OrganizationMembership[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}