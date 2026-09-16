import { MemberService } from '../features/organizations/member.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    organizationMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    position: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  organizationMember: {
    findFirst: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  position: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

const baseUser = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };

function makeRow(overrides: {
  id?: string;
  isActive?: boolean;
  adminPermissions?: boolean;
}): Record<string, unknown> {
  return {
    id: overrides.id ?? 'member-admin',
    isActive: overrides.isActive ?? true,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    removedAt: null,
    user: baseUser,
    position: {
      id: 'pos-president',
      name: 'President',
      description: null,
      permissions: overrides.adminPermissions === false
        ? []
        : [{ permission: { code: 'MANAGE_MEMBERS' } }],
    },
  };
}

type TxMock = {
  organizationMember: { update: jest.Mock };
  activityLog: { create: jest.Mock };
};

function makeTx(): TxMock {
  return {
    organizationMember: {
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...makeRow({}), ...data }),
      ),
    },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('MemberService - last-admin guard (never-cut)', () => {
  let service: MemberService;
  let tx: TxMock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MemberService();
    tx = makeTx();
    prismaMock.$transaction.mockImplementation((cb: (tx: TxMock) => unknown) =>
      Promise.resolve(cb(tx)),
    );
  });

  it('refuses to deactivate the only active admin (409)', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(makeRow({}));
    prismaMock.organizationMember.count.mockResolvedValue(1);

    await expect(
      service.deactivateMember('org-1', 'member-admin', { organizationMemberId: 'actor' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'The last remaining admin cannot be demoted or deactivated.',
    });

    expect(tx.organizationMember.update).not.toHaveBeenCalled();
  });

  it('refuses to demote the only active admin to a non-admin position (409)', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(makeRow({}));
    prismaMock.organizationMember.count.mockResolvedValue(1);
    prismaMock.position.findFirst.mockResolvedValue({ id: 'pos-member', name: 'Member' });

    await expect(
      service.updateMemberPosition('org-1', 'member-admin', 'pos-member', {
        organizationMemberId: 'actor',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(tx.organizationMember.update).not.toHaveBeenCalled();
  });

  it('allows deactivating an admin while another active admin remains', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(makeRow({}));
    prismaMock.organizationMember.count.mockResolvedValue(2);

    const result = await service.deactivateMember('org-1', 'member-admin', {
      organizationMemberId: 'actor',
    });

    expect(tx.organizationMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'member-admin' } }),
    );
    expect(result.member.isActive).toBe(false);
  });

  it('never consults the guard for non-admin members', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(
      makeRow({ id: 'member-plain', adminPermissions: false }),
    );

    await service.deactivateMember('org-1', 'member-plain', { organizationMemberId: 'actor' });

    expect(prismaMock.organizationMember.count).not.toHaveBeenCalled();
    expect(tx.organizationMember.update).toHaveBeenCalled();
  });

  it('404s when the member belongs to another organization', async () => {
    prismaMock.organizationMember.findFirst.mockResolvedValue(null);

    await expect(
      service.deactivateMember('org-1', 'member-elsewhere', { organizationMemberId: 'actor' }),
    ).rejects.toMatchObject({ statusCode: 404, message: 'Member not found' });
  });
});