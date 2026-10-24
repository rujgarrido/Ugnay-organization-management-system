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

/** Global permission codes that must exist in the database before org creation. */
const ALL_PERMISSION_CODES = [
  ...new Set(DEFAULT_POSITIONS.flatMap((seed) => seed.permissions)),
]

/**
 * Organization lifecycle (US-2.2 / US-2.3 / US-2.6). Creation is one atomic
 * transaction: organization -> default positions + permissions -> creator's
 * President membership -> activity log entry. Any failure rolls back
 * everything, so the frontend's local membership append can never go stale
 * (FLAG-9).
 *
 * Performance fix (PROD-001): replace the old per-position permission upsert
 * loop (~40 individual queries inside one interactive transaction) with a
 * single findMany + batched createManyAndReturn for positions + single
 * createMany for PositionPermission joins. Transaction timeout raised to
 * 10 000 ms.
 */
export class OrganizationService {
  async create(userId: string, input: { name: string; description: string }) {
    const organization = await prisma.$transaction(
      async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: input.name,
            description: input.description || null,
          },
        });

        // 1) Fetch all global permissions in ONE query (no upserts inside tx).
        const permissionRows = await tx.permission.findMany({
          where: { code: { in: ALL_PERMISSION_CODES } },
          select: { id: true, code: true },
        });

        if (permissionRows.length !== ALL_PERMISSION_CODES.length) {
          const foundCodes = new Set(permissionRows.map((p) => p.code));
          const missing = ALL_PERMISSION_CODES.filter(
            (code) => !foundCodes.has(code),
          );
          throw new AppError(
            `Missing global permission(s) in database: ${missing.join(', ')}. Run the seed-global-permissions migration before creating organizations.`,
            500,
          );
        }

        const permissionById = new Map(permissionRows.map((p) => [p.code, p.id]));

        // 2) Create all default positions in a single batch.
        const createdPositions = await tx.position.createManyAndReturn({
          data: DEFAULT_POSITIONS.map((seed) => ({
            organizationId: org.id,
            name: seed.name,
            description: seed.description,
          })),
        });

        const presidentPosition =
          createdPositions.find((p) => p.name === 'President');
        if (!presidentPosition) {
          throw new Error('President position seed is missing');
        }

        // 3) Build all PositionPermission join rows in memory, then insert in one batch.
        const positionPermissionData: Array<{
          positionId: string;
          permissionId: string;
        }> = [];
        for (const position of createdPositions) {
          const seed = DEFAULT_POSITIONS.find((s) => s.name === position.name);
          if (!seed) continue;
          for (const code of seed.permissions) {
            const permissionId = permissionById.get(code);
            if (permissionId) {
              positionPermissionData.push({
                positionId: position.id,
                permissionId,
              });
            }
          }
        }

        if (positionPermissionData.length > 0) {
          await tx.positionPermission.createMany({
            data: positionPermissionData,
          });
        }

        const member = await tx.organizationMember.create({
          data: {
            userId,
            organizationId: org.id,
            positionId: presidentPosition.id,
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
      },
      { timeout: 10000 },
    );

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




