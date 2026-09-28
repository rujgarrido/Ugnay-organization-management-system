import { getDashboardCounts } from '../features/organizations/activity.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    project: { count: jest.fn() },
    task: { count: jest.fn(), groupBy: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  project: { count: jest.Mock };
  task: { count: jest.Mock; groupBy: jest.Mock };
};

describe('getDashboardCounts (US-4.1)', () => {
  beforeEach(() => {
    prismaMock.project.count.mockResolvedValue(0);
    prismaMock.task.count.mockResolvedValue(0);
    prismaMock.task.groupBy.mockResolvedValue([]);
  });

  it('scopes every count and the status grouping to the organization', async () => {
    prismaMock.project.count.mockResolvedValue(2);
    prismaMock.task.count.mockResolvedValueOnce(5).mockResolvedValueOnce(1).mockResolvedValueOnce(4);

    const result = await getDashboardCounts('org-1');

    expect(prismaMock.project.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', status: 'ACTIVE' },
    });
    expect(prismaMock.task.count).toHaveBeenCalledWith({
      where: { project: { organizationId: 'org-1' }, status: { not: 'DONE' } },
    });
    expect(prismaMock.task.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { project: { organizationId: 'org-1' } },
      _count: { _all: true },
    });
    expect(result).toMatchObject({
      activeProjects: 2,
      openTasks: 5,
      overdueTasks: 1,
      completedTasks: 4,
    });
  });

  it('maps database statuses to the lowercase wire contract and zero-fills the rest', async () => {
    prismaMock.task.groupBy.mockResolvedValue([
      { status: 'BACKLOG', _count: { _all: 3 } },
      { status: 'IN_PROGRESS', _count: { _all: 2 } },
      { status: 'DONE', _count: { _all: 4 } },
    ]);

    const { tasksByStatus } = await getDashboardCounts('org-1');

    expect(tasksByStatus).toEqual({ backlog: 3, todo: 0, in_progress: 2, review: 0, done: 4 });
  });
});
