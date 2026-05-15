/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-function-type */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/users.entity';

interface MockRequest {
  user?: User;
  session: {
    user?: User;
    destroy: jest.Mock;
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
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
      const mockRequest: MockRequest = {
        user: mockUser,
        session: mockSession as any,
      };

      const result = controller.login(mockRequest as any);

      expect(mockRequest.session.user).toEqual(mockUser);
      expect(result).toEqual({ message: 'Login successful' });
    });

    it('should return correct response shape', () => {
      const mockRequest: MockRequest = {
        user: { user_id: 1 } as User,
        session: {} as any,
      };

      const result = controller.login(mockRequest as any);

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Login successful');
    });

    it('should store user in session with correct property name', () => {
      const mockUser = {
        user_id: 123,
        email: 'test@example.com',
      } as User;

      const mockSession = {};
      const mockRequest: MockRequest = {
        user: mockUser,
        session: mockSession as any,
      };

      controller.login(mockRequest as any);

      expect(mockSession).toHaveProperty('user');
      expect((mockSession as any).user).toEqual(mockUser);
    });

    it('should handle user with full profile', () => {
      const mockUser: User = {
        user_id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        password_hash: Buffer.from('hash'),
        is_approved: true,
      };

      const mockRequest: MockRequest = {
        user: mockUser,
        session: {} as any,
      };

      const result = controller.login(mockRequest as any);

      expect(mockRequest.session.user).toEqual(mockUser);
      expect(result.message).toBe('Login successful');
    });

    it('should overwrite previous session user on re-login', () => {
      const user1 = { user_id: 1, email: 'user1@example.com' } as User;
      const user2 = { user_id: 2, email: 'user2@example.com' } as User;

      const mockSession = { user: user1 };
      const mockRequest: MockRequest = {
        user: user2,
        session: mockSession as any,
      };

      controller.login(mockRequest as any);

      expect(mockSession.user).toEqual(user2);
      expect(mockSession.user.user_id).toBe(2);
    });
  });

  describe('logout', () => {
    it('should destroy session and return success message', () => {
      const destroyMock = jest.fn();
      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      const result = controller.logout(mockRequest as any);

      expect(destroyMock).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should return correct response shape', () => {
      const mockRequest: MockRequest = {
        session: {
          destroy: jest.fn(),
        },
      };

      const result = controller.logout(mockRequest as any);

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Logout successful');
    });

    it('should call session.destroy exactly once', () => {
      const destroyMock = jest.fn();
      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest as any);

      expect(destroyMock).toHaveBeenCalledTimes(1);
    });

    it('should call destroy without arguments', () => {
      const destroyMock = jest.fn();
      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest as any);

      expect(destroyMock).toHaveBeenCalledWith();
    });

    it('should handle session destroy callbacks', () => {
      const destroyMock = jest.fn((callback) => {
        if (callback) (callback as Function)();
      });

      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      const result = controller.logout(mockRequest as any);

      expect(destroyMock).toHaveBeenCalled();
      expect(result.message).toBe('Logout successful');
    });

    it('should handle multiple logouts in sequence', () => {
      const destroyMock = jest.fn();
      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      controller.logout(mockRequest as any);
      controller.logout(mockRequest as any);

      expect(destroyMock).toHaveBeenCalledTimes(2);
    });

    it('should propagate session destroy errors', () => {
      const error = new Error('Session destroy failed');
      const destroyMock = jest.fn(() => {
        throw error;
      });

      const mockRequest: MockRequest = {
        session: {
          destroy: destroyMock,
        },
      };

      expect(() => controller.logout(mockRequest as any)).toThrow(
        'Session destroy failed',
      );
    });
  });
});
