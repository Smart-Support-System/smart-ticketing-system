/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketEntity } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: any;
  let messageRepository: any;
  const mockCurrentUser = { user_id: 1, role: 'user' as const };
  const mockAdminUser = { user_id: 2, role: 'admin' as const };

  beforeEach(async () => {
    // Mock repository implementation
    const queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    ticketRepository = {
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({
          ticketId: 1,
          title: entity.title || 'Test',
          description: entity.description || 'desc',
          ticketPriority: entity.ticketPriority || 'medium',
          ticketStatus: entity.ticketStatus || 'open',
          userId: entity.userId || 1,
          user: { name: 'Test User', email: 'test@example.com' },
          isArchived: entity.isArchived || false,
          chatStarted: entity.chatStarted || false,
          createdDate: entity.createdDate || new Date(),
          ...entity,
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn().mockImplementation((entity) => ({
        ticketId: 1,
        ...entity,
      })),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    messageRepository = {
      save: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(TicketEntity),
          useValue: ticketRepository,
        },
        {
          provide: getRepositoryToken(TicketMessage),
          useValue: messageRepository,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe('create', () => {
    it('should create a ticket with all required fields', async () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test Description',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        priority: 'high',
      };

      ticketRepository.findOne.mockResolvedValueOnce({
        ticketId: 1,
        title: createTicketDto.title,
        description: createTicketDto.description,
        ticketPriority: 'high',
        ticketStatus: 'open',
        userId: mockCurrentUser.user_id,
        user: { name: 'Test User', email: 'test@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      });

      const result = await service.create(createTicketDto, mockCurrentUser);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', 'Test Ticket');
      expect(result).toHaveProperty('priority', 'high');
    });

    it('should set default priority to medium if not provided', async () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test Description',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
      };

      ticketRepository.findOne.mockResolvedValueOnce({
        ticketId: 1,
        title: createTicketDto.title,
        description: createTicketDto.description,
        ticketPriority: 'medium',
        ticketStatus: 'open',
        userId: mockCurrentUser.user_id,
        user: { name: 'Test User', email: 'test@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      });

      const result = await service.create(createTicketDto, mockCurrentUser);

      expect(result).toHaveProperty('priority', 'medium');
    });

    it('should set ticket status to open', async () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test Description',
        customerName: 'Bob Wilson',
        customerEmail: 'bob@example.com',
      };

      ticketRepository.findOne.mockResolvedValueOnce({
        ticketId: 1,
        title: createTicketDto.title,
        description: createTicketDto.description,
        ticketPriority: 'medium',
        ticketStatus: 'open',
        userId: mockCurrentUser.user_id,
        user: { name: 'Test User', email: 'test@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      });

      const result = await service.create(createTicketDto, mockCurrentUser);

      expect(result).toHaveProperty('status', 'open');
    });

    it('should throw NotFoundException if ticket not found after save', async () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test Description',
        customerName: 'Alice Brown',
        customerEmail: 'alice@example.com',
      };

      ticketRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create(createTicketDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all non-archived tickets for regular user', async () => {
      const mockTickets = [
        {
          ticketId: 1,
          title: 'Ticket 1',
          description: 'desc',
          ticketPriority: 'medium',
          ticketStatus: 'open',
          userId: mockCurrentUser.user_id,
          user: { name: 'Test User', email: 'test@example.com' },
          createdDate: new Date(),
          isArchived: false,
          chatStarted: false,
        },
        {
          ticketId: 2,
          title: 'Ticket 2',
          description: 'desc',
          ticketPriority: 'high',
          ticketStatus: 'open',
          userId: mockCurrentUser.user_id,
          user: { name: 'Test User', email: 'test@example.com' },
          createdDate: new Date(),
          isArchived: false,
          chatStarted: false,
        },
      ];

      ticketRepository.findAndCount.mockResolvedValueOnce([mockTickets, 2]);

      const result = await service.findAll(mockCurrentUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should only return tickets for current user when not staff', async () => {
      const mockTickets = [
        {
          ticketId: 1,
          title: 'Ticket 1',
          description: 'desc',
          ticketPriority: 'medium',
          ticketStatus: 'open',
          userId: mockCurrentUser.user_id,
          user: { name: 'Test User', email: 'test@example.com' },
          createdDate: new Date(),
          isArchived: false,
          chatStarted: false,
        },
      ];

      ticketRepository.findAndCount.mockResolvedValueOnce([mockTickets, 1]);

      const result = await service.findAll(mockCurrentUser);

      expect(ticketRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockCurrentUser.user_id,
            isArchived: false,
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single ticket by ID', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'open',
        userId: mockCurrentUser.user_id,
        user: { name: 'Test User', email: 'test@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);

      const result = await service.findOne(1, mockCurrentUser);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', 'Test Ticket');
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      ticketRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(999, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow staff to view any ticket', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'open',
        userId: 999, // Different user
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);

      const staffUser = { user_id: 2, role: 'agent' as const };
      const result = await service.findOne(1, staffUser);

      expect(result).toHaveProperty('id', 1);
    });

    it('should prevent regular user from viewing other users tickets', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'open',
        userId: 999, // Different user
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);

      await expect(service.findOne(1, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status successfully', async () => {
      const updateDto: UpdateTicketStatusDto = { status: 'in-progress' };

      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'pending',
        userId: 2,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket); // First findOne (before update)
      ticketRepository.save.mockResolvedValueOnce({
        ...mockTicket,
        ticketStatus: 'pending',
      });
      ticketRepository.findOne.mockResolvedValueOnce({
        ...mockTicket,
        ticketStatus: 'pending',
      }); // Second findOne (after save)

      const staffUser = { user_id: 2, role: 'agent' as const };
      const result = await service.updateStatus(1, updateDto, staffUser);

      expect(result).toHaveProperty('status', 'in-progress');
    });

    it('should convert pending status to in-progress for frontend', async () => {
      const updateDto: UpdateTicketStatusDto = { status: 'in-progress' };

      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'pending',
        userId: 2,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket); // First findOne
      ticketRepository.save.mockResolvedValueOnce(mockTicket);
      ticketRepository.findOne.mockResolvedValueOnce(mockTicket); // Second findOne

      const staffUser = { user_id: 2, role: 'agent' as const };
      const result = await service.updateStatus(1, updateDto, staffUser);

      expect(result.status).toBe('in-progress');
    });

    it('should prevent non-staff from updating status', async () => {
      const updateDto: UpdateTicketStatusDto = { status: 'closed' };

      await expect(
        service.updateStatus(1, updateDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when updating non-existent ticket', async () => {
      const updateDto: UpdateTicketStatusDto = { status: 'closed' };

      ticketRepository.findOne.mockResolvedValueOnce(null);

      const staffUser = { user_id: 2, role: 'agent' as const };

      await expect(
        service.updateStatus(999, updateDto, staffUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a ticket successfully', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'closed',
        userId: 999,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);
      ticketRepository.save.mockResolvedValueOnce({
        ...mockTicket,
        isArchived: true,
      });

      const staffUser = { user_id: 2, role: 'agent' as const };
      const result = await service.archive(1, staffUser);

      expect(result.message).toContain('archived successfully');
    });

    it('should prevent regular user from archiving', async () => {
      await expect(service.archive(1, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when archiving non-existent ticket', async () => {
      ticketRepository.findOne.mockResolvedValueOnce(null);

      const staffUser = { user_id: 2, role: 'agent' as const };

      await expect(service.archive(999, staffUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow admin to archive tickets', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'closed',
        userId: 999,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);
      ticketRepository.save.mockResolvedValueOnce({
        ...mockTicket,
        isArchived: true,
      });

      const result = await service.archive(1, mockAdminUser);

      expect(result.message).toContain('archived successfully');
    });
  });

  describe('deleteArchived', () => {
    it('should permanently delete an archived ticket', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'closed',
        userId: 999,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: true,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);
      ticketRepository.delete.mockResolvedValueOnce({ affected: 1 });

      const result = await service.deleteArchived(1, mockAdminUser);

      expect(result.message).toContain('deleted permanently');
    });

    it('should prevent non-admin from deleting archived tickets', async () => {
      const staffUser = { user_id: 2, role: 'agent' as const };

      await expect(service.deleteArchived(1, staffUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when deleting non-existent archived ticket', async () => {
      ticketRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.deleteArchived(999, mockAdminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent deletion of non-archived tickets', async () => {
      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'high',
        ticketStatus: 'closed',
        userId: 999,
        user: { name: 'Other User', email: 'other@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.deleteArchived(1, mockAdminUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Test startChat added by Michael Hahm
  describe('startChat', () => {
    it('should allow an agent to start a ticket chat', async () => {
      const staffUser = { user_id: 2, role: 'agent' as const };

      const mockTicket = {
        ticketId: 1,
        title: 'Test Ticket',
        description: 'Test Description',
        ticketPriority: 'medium',
        ticketStatus: 'open',
        userId: 1,
        user: { name: 'Test User', email: 'test@example.com' },
        createdDate: new Date(),
        isArchived: false,
        chatStarted: false,
      };

      ticketRepository.findOne.mockResolvedValueOnce(mockTicket);
      ticketRepository.save.mockResolvedValueOnce({
        ...mockTicket,
        chatStarted: true,
      });

      const result = await service.startChat(1, staffUser);

      expect(ticketRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ticketId: 1,
          }),
        }),
      );

      expect(ticketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          chatStarted: true,
        }),
      );

      expect(result).toBeDefined();
    });

    it('should prevent a regular user from starting a ticket chat', async () => {
      await expect(service.startChat(1, mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(ticketRepository.save).not.toHaveBeenCalled();
    });
  });
});
