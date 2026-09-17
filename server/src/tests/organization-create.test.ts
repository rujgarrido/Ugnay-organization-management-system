import { OrganizationService } from '../features/organizations/organization.service';
import { prisma } from '../config/database';
import { DEFAULT_POSITIONS, PERMISSION_CODES } from '../features/organizations/position-seeds';

jest.mock('../config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    organization: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
};

type TxMock = {
  organization: { create: jest.Mock };
  position: { create: jest.Mock };
  permission: { upsert: jest.Mock };
  positionPermission: { createMany: jest.Mock };
  organizationMember: { create: jest.Mock };
  activityLog: { create: jest.Mock };
};

function makeTx(): TxMock {
  return {
    organization: {
      create: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: 'Smoke Org',
        description: null,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    },
    position: {
      create: jest.fn().mockImplementation(({ data }: { data: { name: string } }) =>
        Promise.resolve({ id: `pos-${data.name}`, name: data.name, description: null }),
      ),
    },
    permission: {
      upsert: jest.fn().mockImplementation(({ where }: { where: { code: string } }) =>
        Promise.resolve({ id: `perm-${where.code}` }),
      ),
    },
    positionPermission: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    organizationMember: {
      create: jest.fn().mockImplementation(({ data }: { data: { positionId: string } }) =>
        Promise.resolve({
          id: 'member-1',
          isActive: true,
          joinedAt: new Date('2026-01-01T00:00:00.000Z'),
          removedAt: null,
          organization: {
            id: 'org-1',
            name: 'Smoke Org',
            description: null,
            status: 'ACTIVE',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          position: {
            id: data.positionId,
            name: 'President',
            description: 'Full access to the organization.',
            permissions: PERMISSION_CODES.map((code) => ({ permission: { code } })),
          },
        }),
      ),
    },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('OrganizationService.create (US-2.2 atomic create)', () => {
  let service: OrganizationService;
  let tx: TxMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationService();
    tx = makeTx();
    prismaMock.$transaction.mockImplementation((callback: (tx: TxMock) => unknown) =>
      Promise.resolve(callback(tx)),
    );
  });

  it('seeds every default position and grants the creator the President membership', async () => {
    const result = await service.create('user-1', {
      name: 'Smoke Org',
      description: 'e2e',
    });

    expect(tx.position.create).toHaveBeenCalledTimes(DEFAULT_POSITIONS.length);
    expect(tx.positionPermission.createMany).toHaveBeenCalledTimes(DEFAULT_POSITIONS.length);

    // President holds every permission code.
    const presidentCall = tx.organizationMember.create.mock.calls[0][0];
    expect(presidentCall.data).toMatchObject({
      userId: 'user-1',
      organizationId: 'org-1',
      positionId: 'pos-President',
    });

    expect(result.organization).toMatchObject({ id: 'org-1', name: 'Smoke Org', status: 'active' });
    expect(result.membership.position.name).toBe('President');
    expect(result.membership.permissions).toEqual([...PERMISSION_CODES]);
  });

  it('writes an append-only activity row with lowercase entityType', async () => {
    await service.create('user-1', { name: 'Smoke Org', description: '' });

    expect(tx.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          organizationMemberId: 'member-1',
          action: 'created organization',
          entityType: 'organization',
          entityId: 'org-1',
        }),
      }),
    );
  });

  it('runs the whole create inside a single transaction (nothing partially written)', async () => {
    await service.create('user-1', { name: 'Smoke Org', description: '' });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('fails the whole create when the President position id comes back falsy', async () => {
    const failingTx = makeTx();
    failingTx.position.create.mockImplementation(({ data }: { data: { name: string } }) =>
      Promise.resolve({
        id: data.name === 'President' ? null : `pos-${data.name}`,
        name: data.name,
        description: null,
      }),
    );
    prismaMock.$transaction.mockImplementation((callback: (tx: TxMock) => unknown) =>
      Promise.resolve(callback(failingTx)),
    );

    await expect(service.create('user-1', { name: 'Smoke Org', description: '' })).rejects.toThrow(
      'President position seed is missing',
    );
  });
});
