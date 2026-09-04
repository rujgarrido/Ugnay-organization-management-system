import { AuthService } from '../features/auth/auth.service';
import { AuthRepository } from '../features/auth/auth.repository';

import {
  hashRefreshToken,
} from '../lib/jwt.util';

jest.mock('../lib/jwt.util');

describe('AuthService - logout', () => {
  const mockAuthRepository = {
    findRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      mockAuthRepository as unknown as AuthRepository,
    );
  });

  describe('logout', () => {
    it('revokes the token when it exists and is not already revoked', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      mockAuthRepository.findRefreshToken.mockResolvedValue({
        id: 'token-row-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        revokedAt: null,
      });

      await authService.logout('raw-refresh-token');

      expect(mockAuthRepository.revokeRefreshToken)
        .toHaveBeenCalledWith('token-row-1');
    });

    it('throws a 401 AppError when the token is not found', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('unknown-hash');

      mockAuthRepository.findRefreshToken
        .mockResolvedValue(null);

      await expect(
        authService.logout('bad-token'),
      ).rejects.toMatchObject({
        message: 'Invalid refresh token',
        statusCode: 401,
      });

      expect(mockAuthRepository.revokeRefreshToken)
        .not.toHaveBeenCalled();
    });

    it('does nothing when the token was already revoked', async () => {
      (hashRefreshToken as jest.Mock)
        .mockReturnValue('hashed-refresh-token');

      mockAuthRepository.findRefreshToken.mockResolvedValue({
        id: 'token-row-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        revokedAt: new Date(),
      });

      await expect(
        authService.logout('raw-refresh-token'),
      ).resolves.toBeUndefined();

      expect(mockAuthRepository.revokeRefreshToken)
        .not.toHaveBeenCalled();
    });
  });
});