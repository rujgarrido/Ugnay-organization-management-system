import { AuthService } from '../features/auth/auth.service';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';

jest.mock('bcrypt');

jest.mock('../config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock; create: jest.Mock };
};

describe('AuthService - register', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  const registerInput = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'plainPassword123',
    confirmPassword: 'plainPassword123',
  };

  describe('register', () => {
    it('creates a new user and returns safe fields when the email is not taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      prismaMock.user.create.mockResolvedValue({
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });

      const result = await authService.register(registerInput);

      expect(prismaMock.user.findUnique)
        .toHaveBeenCalledWith({ where: { email: 'test@example.com' } });

      expect(bcrypt.hash)
        .toHaveBeenCalledWith('plainPassword123', 10);

      expect(result).toEqual({
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        memberships: [],
      });

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws a 409 AppError when the email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(
        authService.register(registerInput),
      ).rejects.toMatchObject({
        message: 'User already exists',
        statusCode: 409,
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});