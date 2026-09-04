import { AuthService } from '../features/auth/auth.service';
import { AuthRepository } from '../features/auth/auth.repository';
import bcrypt from 'bcrypt'

import {
  generateRefreshToken,
  hashRefreshToken,
  generateAccessToken,
} from '../lib/jwt.util';

jest.mock('bcrypt');
jest.mock('../lib/jwt.util');

describe('AuthService - login', () => {
  const mockAuthRepository = {
    findUserByEmail: jest.fn(),
    createRefreshToken: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      mockAuthRepository as unknown as AuthRepository,
    );
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
    it('returns tokens on correct credentials', async () => {
      mockAuthRepository.findUserByEmail
        .mockResolvedValue(existingUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      (generateAccessToken as jest.Mock)
        .mockReturnValue('fake.jwt.token');

      (generateRefreshToken as jest.Mock)
        .mockReturnValue('raw-refresh-token');

      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      const result = await authService.login(loginInput);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword123',
        'hashedPassword',
      );

      expect(generateAccessToken)
        .toHaveBeenCalledWith({ id: 'user-1' });

      expect(mockAuthRepository.createRefreshToken)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            tokenHash: 'hashed-refresh-token',
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
        },
      });
    });

    it('throws generic 401 when the email does not exist', async () => {
      mockAuthRepository.findUserByEmail
        .mockResolvedValue(null);

      await expect(
        authService.login(loginInput),
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws the SAME generic 401 when the password is wrong', async () => {
      mockAuthRepository.findUserByEmail
        .mockResolvedValue(existingUser);

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