export const dashboardKeys = {
  overview: (orgId: string) => ["dashboard", "overview", orgId] as const,
  activity: (orgId: string, page: number, entityType: string = "all") =>
    ["dashboard", "activity", orgId, page, entityType] as const,
};

export const organizationKeys = {
  detail: (orgId: string) => ["organizations", "detail", orgId] as const,
  members: (orgId: string) => ["organizations", "members", orgId] as const,
  positions: (orgId: string) => ["organizations", "positions", orgId] as const,
};

export const projectKeys = {
  list: (orgId: string) => ["projects", "list", orgId] as const,
  detail: (orgId: string, projectId: string) => ["projects", "detail", orgId, projectId] as const,
};

export const taskKeys = {
  list: (projectId: string) => ["tasks", "list", projectId] as const,
};

export const proposalKeys = {
  list: (orgId: string) => ["proposals", "list", orgId] as const,
  detail: (orgId: string, proposalId: string) => ["proposals", "detail", orgId, proposalId] as const,
  signatures: (proposalId: string) => ["proposals", "signatures", proposalId] as const,
};
