import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { recordActivity } from './activity.service';

/**
 * Organization membership management (US-2.4 / US-2.5). Add/remove/change
 * position are admin-only (route enforces MANAGE_MEMBERS); the service owns
 * the never-cut last-admin guard.
 */

export interface SerializedMember {
  id: string;
  name: string;
  email: string;
  position: { id: string; name: string; description: string | null };
  permissions: string[];
  isActive: boolean;
  joinedAt: string;
}

const memberInclude = {
  user: true,
  position: { include: { permissions: { include: { permission: true } } } },
} as const;

type MemberRow = {
  id: string;
  isActive: boolean;
  joinedAt: Date;
  removedAt: Date | null;
  user: { firstName: string; lastName: string; email: string };
  position: {
    id: string;
    name: string;
    description: string | null;
    permissions: Array<{ permission: { code: string } }>;
  };
};

function serializeMember(member: MemberRow): SerializedMember {
  return {
    id: member.id,
    name: [member.user.firstName, member.user.lastName].filter(Boolean).join(' '),
    email: member.user.email,
    position: {
      id: member.position.id,
      name: member.position.name,
      description: member.position.description,
    },
    permissions: member.position.permissions.map((entry) => entry.permission.code),
    isActive: member.isActive,
    joinedAt: member.joinedAt.toISOString(),
  };
}

async function findMemberRow(organizationId: string, memberId: string): Promise<MemberRow> {
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
    include: memberInclude,
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return member as unknown as MemberRow;
}

/** The never-cut guard: an org must always keep at least one active admin. */
async function assertNotLastAdmin(organizationId: string, member: MemberRow): Promise<void> {
  const isTargetAdmin =
    member.isActive &&
    member.position.permissions.some((entry) => entry.permission.code === 'MANAGE_MEMBERS');

  if (!isTargetAdmin) return;

  const activeAdminCount = await prisma.organizationMember.count({
    where: {
      organizationId,
      isActive: true,
      position: { permissions: { some: { permission: { code: 'MANAGE_MEMBERS' } } } },
    },
  });

  if (activeAdminCount <= 1) {
    throw new AppError('The last remaining admin cannot be demoted or deactivated.', 409);
  }
}

export class MemberService {
  async getMembers(organizationId: string) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: memberInclude,
      orderBy: { joinedAt: 'asc' },
    });

    return { members: members.map((member) => serializeMember(member as unknown as MemberRow)) };
  }

  async addMember(
    organizationId: string,
    input: { email: string; positionId: string },
    ctx: { organizationMemberId: string },
  ) {
    // Registered-users-only for MVP (plan decision — no invite flow, FLAG-6).
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError('No registered user with this email address.', 404);
    }

    const position = await prisma.position.findFirst({
      where: { id: input.positionId, organizationId },
    });
    if (!position) {
      throw new AppError('Position not found', 404);
    }

    const existing = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });
    if (existing && existing.isActive) {
      throw new AppError('This user is already a member of the organization.', 409);
    }

    const member = await prisma.$transaction(async (tx) => {
      const row = existing
        ? await tx.organizationMember.update({
            where: { id: existing.id },
            data: { isActive: true, removedAt: null, positionId: position.id },
            include: memberInclude,
          })
        : await tx.organizationMember.create({
            data: {
              userId: user.id,
              organizationId,
              positionId: position.id,
            },
            include: memberInclude,
          });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'added member',
        entityType: 'member',
        entityId: row.id,
        entityName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      });

      return row;
    });

    return { member: serializeMember(member as unknown as MemberRow) };
  }

  async updateMemberPosition(
    organizationId: string,
    memberId: string,
    positionId: string,
    ctx: { organizationMemberId: string },
  ) {
    const member = await findMemberRow(organizationId, memberId);

    const position = await prisma.position.findFirst({
      where: { id: positionId, organizationId },
    });
    if (!position) {
      throw new AppError('Position not found', 404);
    }

    await assertNotLastAdmin(organizationId, member);

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.organizationMember.update({
        where: { id: member.id },
        data: { positionId: position.id },
        include: memberInclude,
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'changed member position',
        entityType: 'member',
        entityId: row.id,
        entityName: serializeMember(row as unknown as MemberRow).name,
      });

      return row;
    });

    return { member: serializeMember(updated as unknown as MemberRow) };
  }

  async deactivateMember(
    organizationId: string,
    memberId: string,
    ctx: { organizationMemberId: string },
  ) {
    const member = await findMemberRow(organizationId, memberId);

    if (!member.isActive) {
      return { member: serializeMember(member) };
    }

    await assertNotLastAdmin(organizationId, member);

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.organizationMember.update({
        where: { id: member.id },
        data: { isActive: false, removedAt: new Date() },
        include: memberInclude,
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'deactivated member',
        entityType: 'member',
        entityId: row.id,
        entityName: serializeMember(row as unknown as MemberRow).name,
      });

      return row;
    });

    return { member: serializeMember(updated as unknown as MemberRow) };
  }
}