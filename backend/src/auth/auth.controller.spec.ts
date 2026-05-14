import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { User } from '../users/users.entity';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should save user to session and return success message', () => {
      const mockUser: User = {
        user_id: 1,
        email: 'user@example.com',
        name: 'Test User',
        password_hash: Buffer.from('hash'),
        is_approved: true,
      };

      const mockSession = {};
      const mockRequest = {
        user: mockUser,
        session: mockSession,
      };

      const result = controller.login(mockRequest);

      expect(mockRequest.session.user).toEqual(mockUser);
      expect(result).toEqual({ message: 'Login successful' });
    });

    it('should return correct response shape', () => {
      const mockRequest = {
        user: { user_id: 1 },
        session: {},
      };

      const result = controller.login(mockRequest);

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Login successful');
    });

    it('should store user in session with correct property name', () => {
      const mockUser = {
        user_id: 123,
        email: 'test@example.com',
      };

      const mockSession = {};
      const mockRequest = {
        user: mockUser,
        session: mockSession,
      };

      controller.login(mockRequest);

      expect(mockSession).toHaveProperty('user');
      expect(mockSession['user']).toEqual(mockUser);
    });

    it('should handle user with full profile', () => {
      const mockUser: User = {
        user_id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        password_hash: Buffer.from('hash'),
        is_approved: true,
      };

      const mockRequest = {
        user: mockUser,
        session: {},
      };

      const result = controller.login(mockRequest);

      expect(mockRequest.session.user).toEqual(mockUser);
      expect(result.message).toBe('Login successful');
    });

    it('should overwrite previous session user on re-login', () => {
      const user1 = { user_id: 1, email: 'user1@example.com' };
      const user2 = { user_id: 2, email: 'user2@example.com' };

      const mockSession = { user: user1 };
      const mockRequest = {
        user: user2,
        session: mockSession,
      };

      controller.login(mockRequest);

      expect(mockSession.user).toEqual(user2);
      expect(mockSession.user.user_id).toBe(2);
    });
  });

  describe('logout', () => {
    it('should destroy session and return success message', () => {
      const destroyMock = jest.fn();
      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      const result = controller.logout(mockRequest);

      expect(destroyMock).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should return correct response shape', () => {
      const mockRequest = {
        session: {
          destroy: jest.fn(),
        },
      };

      const result = controller.logout(mockRequest);

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Logout successful');
    });

    it('should call session.destroy exactly once', () => {
      const destroyMock = jest.fn();
      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest);

      expect(destroyMock).toHaveBeenCalledTimes(1);
    });

    it('should call destroy without arguments', () => {
      const destroyMock = jest.fn();
      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest);

      expect(destroyMock).toHaveBeenCalledWith();
    });

    it('should handle session destroy callbacks', () => {
      const destroyMock = jest.fn((callback) => {
        if (callback) callback(null);
      });

      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      const result = controller.logout(mockRequest);

      expect(destroyMock).toHaveBeenCalled();
      expect(result.message).toBe('Logout successful');
    });

    it('should handle multiple logouts in sequence', () => {
      const destroyMock = jest.fn();
      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest);
      controller.logout(mockRequest);

      expect(destroyMock).toHaveBeenCalledTimes(2);
    });

    it('should propagate session destroy errors', () => {
      const error = new Error('Session destroy failed');
      const destroyMock = jest.fn(() => {
        throw error;
      });

      const mockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      expect(() => controller.logout(mockRequest)).toThrow('Session destroy failed');
    });
  });
});
