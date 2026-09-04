import { AuthService } from '../features/auth/auth.service';
import { AuthRepository } from '../features/auth/auth.repository';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService - register', () => {
  const mockAuthRepository = {
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      mockAuthRepository as unknown as AuthRepository,
    );
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
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      mockAuthRepository.createUser.mockResolvedValue({
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });

      const result = await authService.register(registerInput);

      expect(mockAuthRepository.findUserByEmail)
        .toHaveBeenCalledWith('test@example.com');

      expect(bcrypt.hash)
        .toHaveBeenCalledWith('plainPassword123', 10);

      expect(result).toEqual({
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      });

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws a 409 AppError when the email already exists', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(
        authService.register(registerInput),
      ).rejects.toMatchObject({
        message: 'User already exists',
        statusCode: 409,
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });
});