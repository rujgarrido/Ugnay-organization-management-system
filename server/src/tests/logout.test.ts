import { AuthService } from '../features/auth/auth.service';
import { prisma } from '../config/database';

import { hashRefreshToken } from '../lib/jwt.util';

jest.mock('../lib/jwt.util');

jest.mock('../config/database', () => ({
  prisma: {
    refreshToken: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    organizationMember: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  refreshToken: { findUnique: jest.Mock; update: jest.Mock };
};

describe('AuthService - logout', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('logout', () => {
    it('revokes the token when it exists and is not already revoked', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-row-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        revokedAt: null,
      });

      await authService.logout('raw-refresh-token');

      expect(prismaMock.refreshToken.update)
        .toHaveBeenCalledWith({
          where: { id: 'token-row-1' },
          data: { revokedAt: expect.any(Date) },
        });
    });

    it('throws a 401 AppError when the token is not found', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('unknown-hash');

      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.logout('bad-token'),
      ).rejects.toMatchObject({
        message: 'Invalid refresh token',
        statusCode: 401,
      });

      expect(prismaMock.refreshToken.update)
        .not.toHaveBeenCalled();
    });

    it('does nothing when the token was already revoked', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-row-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        revokedAt: new Date(),
      });

      await expect(
        authService.logout('raw-refresh-token'),
      ).resolves.toBeUndefined();

      expect(prismaMock.refreshToken.update)
        .not.toHaveBeenCalled();
    });
  });
});