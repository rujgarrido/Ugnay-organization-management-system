import { AuthService } from '../features/auth/auth.service';
import { AuthRepository } from '../features/auth/auth.repository';

import {
  hashRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '../lib/jwt.util';

jest.mock('../lib/jwt.util');

describe('AuthService - refreshTokens', () => {
  const mockAuthRepository = {
    findRefreshToken: jest.fn(),
    findUserById: jest.fn(),
    revokeRefreshToken: jest.fn(),
    createRefreshToken: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      mockAuthRepository as unknown as AuthRepository,
    );
  });

  const validRow = {
    id: 'token-row-1',
    userId: 'user-1',
    tokenHash: 'hashed-refresh-token',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  describe('refreshTokens', () => {
    it('rotates the token and returns new tokens when valid', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      mockAuthRepository.findRefreshToken
        .mockResolvedValue(validRow);

      mockAuthRepository.findUserById.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      (generateAccessToken as jest.Mock)
        .mockReturnValue('new.access.token');

      (generateRefreshToken as jest.Mock)
        .mockReturnValue('new-raw-refresh-token');

      const result = await authService.refreshTokens(
        'raw-refresh-token',
      );

      expect(mockAuthRepository.revokeRefreshToken)
        .toHaveBeenCalledWith('token-row-1');

      expect(mockAuthRepository.createRefreshToken)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
          }),
        );

      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new-raw-refresh-token',
      });
    });

    it('throws a 400 AppError when no refresh token is provided', async () => {
      await expect(
        authService.refreshTokens(
          undefined as unknown as string,
        ),
      ).rejects.toMatchObject({
        message: 'Refresh token is required',
        statusCode: 400,
      });

      expect(mockAuthRepository.findRefreshToken)
        .not.toHaveBeenCalled();
    });

    it('throws 401 when the token hash matches nothing', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('some-hash');

      mockAuthRepository.findRefreshToken
        .mockResolvedValue(null);

      await expect(
        authService.refreshTokens('fake-token'),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 when the token was already revoked', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      mockAuthRepository.findRefreshToken.mockResolvedValue({
        ...validRow,
        revokedAt: new Date(),
      });

      await expect(
        authService.refreshTokens('raw-refresh-token'),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 when the token has expired', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      mockAuthRepository.findRefreshToken.mockResolvedValue({
        ...validRow,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        authService.refreshTokens('raw-refresh-token'),
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });
});