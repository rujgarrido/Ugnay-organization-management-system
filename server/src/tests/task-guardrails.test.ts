import { TaskService } from '../features/projects/task.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    project: { findFirst: jest.fn() },
    task: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  project: { findFirst: jest.Mock };
  task: { findFirst: jest.Mock; update: jest.Mock };
  organizationMember: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

function makeTaskRow(overrides: Partial<{ status: string }> = {}): Record<string, unknown> {
  return {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Write bylaws',
    description: null,
    status: overrides.status ?? 'BACKLOG',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    assignee: null,
  };
}

type TxMock = { task: { update: jest.Mock; create: jest.Mock }; activityLog: { create: jest.Mock } };

function makeTx(): TxMock {
  return {
    task: {
      update: jest.fn().mockResolvedValue(makeTaskRow({ status: 'DONE' })),
      create: jest.fn().mockResolvedValue(makeTaskRow()),
    },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('TaskService guardrails (US-3.2/US-3.3)', () => {
  let service: TaskService;
  let tx: TxMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskService();
    tx = makeTx();
    prismaMock.$transaction.mockImplementation((cb: (tx: TxMock) => unknown) =>
      Promise.resolve(cb(tx)),
    );
  });

  it('rejects task creation on an archived project with 409', async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      id: 'proj-1',
      name: 'Old Drive',
      status: 'ARCHIVED',
    });

    await expect(
      service.create(
        'org-1',
        'proj-1',
        { title: 'T', description: '', priority: 'low', assigneeId: null, dueDate: '' },
        { organizationMemberId: 'actor' },
      ),
    ).rejects.toMatchObject({ statusCode: 409, message: 'Cannot add tasks to an archived project.' });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an assignee who is not an active member of the org (404)', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'ACTIVE' });
    prismaMock.organizationMember.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        'org-1',
        'proj-1',
        { title: 'T', description: '', priority: 'low', assigneeId: 'member-x', dueDate: '' },
        { organizationMemberId: 'actor' },
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Assignee must be an active member of the organization.',
    });
  });

  it('404s when the task belongs to a project in another organization (no cross-org leak)', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus('org-1', 'proj-1', 'task-1', 'done', { organizationMemberId: 'actor' }),
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('moves the task to done and writes a lowercase "task" activity row', async () => {
    prismaMock.task.findFirst.mockResolvedValue(makeTaskRow({ status: 'BACKLOG' }));

    const result = await service.updateStatus('org-1', 'proj-1', 'task-1', 'done', {
      organizationMemberId: 'actor',
    });

    expect(tx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'task-1' } }),
    );
    expect(result.task.status).toBe('done');
    expect(tx.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          action: 'completed task',
          entityType: 'task',
          entityId: 'task-1',
        }),
      }),
    );
  });

  it('is idempotent: moving to the current status short-circuits without an activity row', async () => {
    prismaMock.task.findFirst.mockResolvedValue(makeTaskRow({ status: 'DONE' }));

    await service.updateStatus('org-1', 'proj-1', 'task-1', 'done', {
      organizationMemberId: 'actor',
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(tx.activityLog.create).not.toHaveBeenCalled();
  });
});