import { AuthService } from '../features/auth/auth.service';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';

import {
  generateRefreshToken,
  hashRefreshToken,
  generateAccessToken,
} from '../lib/jwt.util';

jest.mock('bcrypt');
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
  refreshToken: { create: jest.Mock };
  organizationMember: { findMany: jest.Mock };
};

describe('AuthService - login', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  const loginInput = {
    email: 'test@example.com',
    password: 'plainPassword123',
  };

  const existingUser = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
  };

  describe('login', () => {
    it('returns tokens and the user with memberships on correct credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      prismaMock.organizationMember.findMany.mockResolvedValue([]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue('fake.jwt.token');
      (generateRefreshToken as jest.Mock).mockReturnValue('raw-refresh-token');
      (hashRefreshToken as jest.Mock).mockReturnValue('hashed-refresh-token');

      const result = await authService.login(loginInput);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword123',
        'hashedPassword',
      );

      expect(generateAccessToken).toHaveBeenCalledWith({ id: 'user-1' });

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            tokenHash: 'hashed-refresh-token',
          }),
        }),
      );

      expect(result).toEqual({
        accessToken: 'fake.jwt.token',
        refreshToken: 'raw-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          memberships: [],
        },
      });
    });

    it('throws generic 401 when the email does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login(loginInput),
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws the SAME generic 401 when the password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login(loginInput),
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });
    });
  });
});