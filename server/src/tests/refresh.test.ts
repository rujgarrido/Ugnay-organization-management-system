import { AuthService } from '../features/auth/auth.service';
import { prisma } from '../config/database';

import {
  hashRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '../lib/jwt.util';

jest.mock('../lib/jwt.util');

jest.mock('../config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    refreshToken: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    organizationMember: { findMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock };
  refreshToken: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
  organizationMember: { findMany: jest.Mock };
};

describe('AuthService - refreshTokens', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  const validRow = {
    id: 'token-row-1',
    userId: 'user-1',
    tokenHash: 'hashed-refresh-token',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  describe('refreshTokens', () => {
    it('rotates the token and returns new tokens plus the user when valid', async () => {
      (hashRefreshToken as jest.Mock).mockReturnValue('hashed-refresh-token');

      prismaMock.refreshToken.findUnique.mockResolvedValue(validRow);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
      prismaMock.organizationMember.findMany.mockResolvedValue([]);

      (generateAccessToken as jest.Mock).mockReturnValue('new.access.token');
      (generateRefreshToken as jest.Mock).mockReturnValue('new-raw-refresh-token');

      const result = await authService.refreshTokens('raw-refresh-token');

      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-row-1' },
        data: { revokedAt: expect.any(Date) },
      });

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );

      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new-raw-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          memberships: [],
        },
      });
    });

    it('throws a 400 AppError when no refresh token is provided', async () => {
      await expect(
        authService.refreshTokens(undefined as unknown as string),
      ).rejects.toMatchObject({
        message: 'Refresh token is required',
        statusCode: 400,
      });

      expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('throws 401 when the token hash matches nothing', async () => {
      (hashRefreshToken as jest.Mock).mockReturnValue('some-hash');

      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('fake-token'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when the token was already revoked', async () => {
      (hashRefreshToken as jest.Mock).mockReturnValue('hashed-refresh-token');

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...validRow,
        revokedAt: new Date(),
      });

      await expect(
        authService.refreshTokens('raw-refresh-token'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when the token has expired', async () => {
      (hashRefreshToken as jest.Mock).mockReturnValue('hashed-refresh-token');

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...validRow,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        authService.refreshTokens('raw-refresh-token'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});