import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  membershipInclude,
  listUserMemberships,
  serializeMembership,
  serializeOrganization,
  type SerializedMembership,
  type MemberWithRelations,
} from './memberships';
import { DEFAULT_POSITIONS } from './position-seeds';
import { recordActivity } from './activity.service';

/**
 * Organization lifecycle (US-2.2 / US-2.3 / US-2.6). Creation is one atomic
 * transaction: organization -> default positions + permissions -> creator's
 * President membership -> activity log entry. Any failure rolls back
 * everything, so the frontend's local membership append can never go stale
 * (FLAG-9).
 */
export class OrganizationService {
  async create(userId: string, input: { name: string; description: string }) {
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          description: input.description || null,
        },
      });

      // Keep the President's position id while seeding.
      let presidentPositionId: string | undefined;

      for (const seed of DEFAULT_POSITIONS) {
        const position = await tx.position.create({
          data: {
            organizationId: org.id,
            name: seed.name,
            description: seed.description,
          },
        });

        // Permission rows are global; upsert keeps this idempotent.
        const permissionRows = await Promise.all(
          seed.permissions.map((code) =>
            tx.permission.upsert({ where: { code }, create: { code }, update: {} }),
          ),
        );

        await tx.positionPermission.createMany({
          data: permissionRows.map((permission) => ({
            positionId: position.id,
            permissionId: permission.id,
          })),
        });

        if (seed.name === 'President') {
          presidentPositionId = position.id;
        }
      }

      if (!presidentPositionId) {
        throw new Error('President position seed is missing');
      }

      const member = await tx.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          positionId: presidentPositionId,
        },
        include: membershipInclude,
      });

      await recordActivity(tx, {
        organizationId: org.id,
        organizationMemberId: member.id,
        action: 'created organization',
        entityType: 'organization',
        entityId: org.id,
        entityName: org.name,
      });

      return { org, member };
    });

    return {
      organization: serializeOrganization(organization.org),
      membership: serializeMembership(organization.member as MemberWithRelations),
    };
  }

  async getMine(userId: string): Promise<{ memberships: SerializedMembership[] }> {
    return { memberships: await listUserMemberships(userId) };
  }

  async getDetail(organizationId: string) {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return { organization: serializeOrganization(organization) };
  }

  async update(
    organizationId: string,
    input: { name: string; description: string },
    ctx: { organizationMemberId: string },
  ) {
    const existing = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!existing) {
      throw new AppError('Organization not found', 404);
    }

    const organization = await prisma.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id: organizationId },
        data: { name: input.name, description: input.description || null },
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'updated organization',
        entityType: 'organization',
        entityId: organizationId,
        entityName: updated.name,
      });

      return updated;
    });

    return { organization: serializeOrganization(organization) };
  }

  async archive(
    organizationId: string,
    ctx: { organizationMemberId: string },
  ) {
    const existing = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!existing) {
      throw new AppError('Organization not found', 404);
    }

    const organization = await prisma.$transaction(async (tx) => {
      const archived = await tx.organization.update({
        where: { id: organizationId },
        data: { status: 'ARCHIVED' },
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'archived organization',
        entityType: 'organization',
        entityId: organizationId,
        entityName: archived.name,
      });

      return archived;
    });

    return { organization: serializeOrganization(organization) };
  }

  async getPositions(organizationId: string) {
    const positions = await prisma.position.findMany({
      where: { organizationId },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });

    return {
      positions: positions.map((position) => ({
        id: position.id,
        name: position.name,
        description: position.description,
        permissions: position.permissions.map((entry) => entry.permission.code),
      })),
    };
  }
}
