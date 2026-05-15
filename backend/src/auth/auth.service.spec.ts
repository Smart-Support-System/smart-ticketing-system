import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/users.entity';

// Mock bcrypt
jest.mock('bcrypt');

/* eslint-disable @typescript-eslint/unbound-method */

describe.skip('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  describe('register', () => {
    it('should successfully register a new user with hashed password', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePass123!';
      const name = 'John Doe';
      const hashedPassword = 'hashed_password_value';

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from(hashedPassword),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email,
        name,
        password_hash: Buffer.from(hashedPassword, 'utf-8'),
        is_approved: false,
      });
      expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should hash password with 10 salt rounds', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from('hash'),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should set is_approved to false for new users', async () => {
      const email = 'newuser@example.com';
      const password = 'pass';
      const name = 'User';

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from('hash'),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      await service.register(email, password, name);

      const createCall = usersRepository.create.mock.calls[0][0];
      expect(createCall.is_approved).toBe(false);
    });

    it('should store password as Buffer', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const name = 'User';
      const hashedPassword = 'hashed';

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from(hashedPassword, 'utf-8'),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      await service.register(email, password, name);

      const createCall = usersRepository.create.mock.calls[0][0];
      expect(createCall.password_hash).toBeInstanceOf(Buffer);
      expect(createCall.password_hash.toString()).toBe(hashedPassword);
    });

    it('should handle registration with special characters in password', async () => {
      const email = 'test@example.com';
      const password = 'P@$$w0rd!#%';
      const name = 'User';
      const hashedPassword = 'complex_hash';

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from(hashedPassword),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should propagate repository save errors', async () => {
      const email = 'test@example.com';
      const password = 'pass';
      const name = 'User';
      const error = new Error('Database error');

      const mockUser: User = {
        user_id: 1,
        email,
        name,
        password_hash: Buffer.from('hash'),
        is_approved: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockRejectedValue(error);

      await expect(service.register(email, password, name)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'user@example.com';
      const password = 'correctPassword';
      const hashedPassword = 'hashed_password';

      const mockUser: User = {
        user_id: 1,
        email,
        name: 'Test User',
        password_hash: Buffer.from(hashedPassword, 'utf-8'),
        is_approved: true,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password';

      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const email = 'user@example.com';
      const password = 'wrongPassword';
      const correctHashedPassword = 'hashed_password';

      const mockUser: User = {
        user_id: 1,
        email,
        name: 'Test User',
        password_hash: Buffer.from(correctHashedPassword, 'utf-8'),
        is_approved: true,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        correctHashedPassword,
      );
      expect(result).toBeNull();
    });

    it('should compare password with stored buffer string representation', async () => {
      const email = 'user@example.com';
      const password = 'password';
      const hashedPassword = 'stored_hash';

      const mockUser: User = {
        user_id: 1,
        email,
        name: 'User',
        password_hash: Buffer.from(hashedPassword, 'utf-8'),
        is_approved: true,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should handle multiple validation attempts independently', async () => {
      const mockUser1: User = {
        user_id: 1,
        email: 'user1@example.com',
        name: 'User 1',
        password_hash: Buffer.from('hash1', 'utf-8'),
        is_approved: true,
      };

      const mockUser2: User = {
        user_id: 2,
        email: 'user2@example.com',
        name: 'User 2',
        password_hash: Buffer.from('hash2', 'utf-8'),
        is_approved: true,
      };

      usersRepository.findOne
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result1 = await service.validateUser('user1@example.com', 'pass1');
      const result2 = await service.validateUser('user2@example.com', 'wrong');

      expect(result1).toEqual(mockUser1);
      expect(result2).toBeNull();
    });

    it('should handle bcrypt comparison errors', async () => {
      const email = 'user@example.com';
      const password = 'password';
      const error = new Error('Bcrypt error');

      const mockUser: User = {
        user_id: 1,
        email,
        name: 'User',
        password_hash: Buffer.from('hash', 'utf-8'),
        is_approved: true,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Bcrypt error',
      );
    });
  });
});
