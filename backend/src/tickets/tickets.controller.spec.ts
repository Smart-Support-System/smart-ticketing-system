import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import type { Ticket } from './interfaces/ticket.interface';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: jest.Mocked<TicketsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            updateStatus: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get(TicketsService) as jest.Mocked<TicketsService>;
  });

  describe('create', () => {
    it('should call service.create with the DTO', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test Ticket',
        description: 'Test description',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        priority: 'high',
      };

      const mockTicket: Ticket = {
        id: 1,
        title: 'Test Ticket',
        description: 'Test description',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        priority: 'high',
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
      };

      service.create.mockReturnValue(mockTicket);

      const result = controller.create(createTicketDto);

      expect(service.create).toHaveBeenCalledWith(createTicketDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTicket);
    });

    it('should return the ticket created by the service', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Bug Report',
        description: 'Login page broken',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
      };

      const mockTicket: Ticket = {
        id: 5,
        title: 'Bug Report',
        description: 'Login page broken',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        priority: 'medium',
        status: 'open',
        createdAt: '2024-01-02T00:00:00Z',
      };

      service.create.mockReturnValue(mockTicket);

      const result = controller.create(createTicketDto);

      expect(result).toEqual(mockTicket);
      expect(result.id).toBe(5);
      expect(result.status).toBe('open');
    });

    it('should propagate service errors', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Test',
        description: 'Test',
        customerName: 'Test',
        customerEmail: 'test@example.com',
      };

      const error = new Error('Database error');
      service.create.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.create(createTicketDto)).toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', () => {
      service.findAll.mockReturnValue([]);

      controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tickets exist', () => {
      service.findAll.mockReturnValue([]);

      const result = controller.findAll();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all tickets from service', () => {
      const mockTickets: Ticket[] = [
        {
          id: 1,
          title: 'Ticket 1',
          description: 'desc',
          customerName: 'Customer 1',
          customerEmail: 'customer1@example.com',
          priority: 'low',
          status: 'open',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'Ticket 2',
          description: 'desc',
          customerName: 'Customer 2',
          customerEmail: 'customer2@example.com',
          priority: 'high',
          status: 'in-progress',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];

      service.findAll.mockReturnValue(mockTickets);

      const result = controller.findAll();

      expect(result).toEqual(mockTickets);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with correct ID', () => {
      const mockTicket: Ticket = {
        id: 123,
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        priority: 'medium',
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
      };

      service.findOne.mockReturnValue(mockTicket);

      controller.findOne(123);

      expect(service.findOne).toHaveBeenCalledWith(123);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return ticket from service', () => {
      const mockTicket: Ticket = {
        id: 42,
        title: 'Find Me',
        description: 'desc',
        customerName: 'Test',
        customerEmail: 'test@example.com',
        priority: 'high',
        status: 'closed',
        createdAt: '2024-01-01T00:00:00Z',
      };

      service.findOne.mockReturnValue(mockTicket);

      const result = controller.findOne(42);

      expect(result).toEqual(mockTicket);
      expect(result.id).toBe(42);
      expect(result.title).toBe('Find Me');
    });

    it('should propagate NotFoundException from service', () => {
      service.findOne.mockImplementation(() => {
        throw new NotFoundException('Ticket not found');
      });

      expect(() => controller.findOne(999)).toThrow(NotFoundException);
    });

    it('should handle different ticket IDs correctly', () => {
      const ticket1: Ticket = {
        id: 1,
        title: 'Ticket 1',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        priority: 'low',
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const ticket2: Ticket = {
        id: 999,
        title: 'Ticket 999',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        priority: 'high',
        status: 'closed',
        createdAt: '2024-01-02T00:00:00Z',
      };

      service.findOne.mockReturnValueOnce(ticket1).mockReturnValueOnce(ticket2);

      const result1 = controller.findOne(1);
      const result2 = controller.findOne(999);

      expect(result1.id).toBe(1);
      expect(result2.id).toBe(999);
      expect(result1.title).not.toBe(result2.title);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus with ID and DTO', () => {
      const updateDto: UpdateTicketStatusDto = { status: 'closed' };
      const mockTicket: Ticket = {
        id: 10,
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        priority: 'medium',
        status: 'closed',
        createdAt: '2024-01-01T00:00:00Z',
      };

      service.updateStatus.mockReturnValue(mockTicket);

      controller.updateStatus(10, updateDto);

      expect(service.updateStatus).toHaveBeenCalledWith(10, updateDto);
      expect(service.updateStatus).toHaveBeenCalledTimes(1);
    });

    it('should return updated ticket from service', () => {
      const updateDto: UpdateTicketStatusDto = { status: 'in-progress' };
      const mockTicket: Ticket = {
        id: 5,
        title: 'Ticket',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        priority: 'high',
        status: 'in-progress',
        createdAt: '2024-01-01T00:00:00Z',
      };

      service.updateStatus.mockReturnValue(mockTicket);

      const result = controller.updateStatus(5, updateDto);

      expect(result).toEqual(mockTicket);
      expect(result.status).toBe('in-progress');
      expect(result.id).toBe(5);
    });

    it('should propagate service errors', () => {
      const updateDto: UpdateTicketStatusDto = { status: 'closed' };

      service.updateStatus.mockImplementation(() => {
        throw new NotFoundException('Ticket not found');
      });

      expect(() => controller.updateStatus(999, updateDto)).toThrow(NotFoundException);
    });

    it('should support updating to all valid status values', () => {
      const statuses: Array<'open' | 'in-progress' | 'closed'> = [
        'open',
        'in-progress',
        'closed',
      ];

      for (const status of statuses) {
        const updateDto: UpdateTicketStatusDto = { status };
        const mockTicket: Ticket = {
          id: 1,
          title: 'Test',
          description: 'desc',
          customerName: 'Customer',
          customerEmail: 'customer@example.com',
          priority: 'medium',
          status,
          createdAt: '2024-01-01T00:00:00Z',
        };

        service.updateStatus.mockReturnValue(mockTicket);

        const result = controller.updateStatus(1, updateDto);

        expect(result.status).toBe(status);
        expect(service.updateStatus).toHaveBeenCalledWith(1, updateDto);
      }
    });
  });

  describe('remove', () => {
    it('should call service.remove with correct ID', () => {
      service.remove.mockReturnValue({ message: 'Ticket with ID 5 deleted successfully' });

      controller.remove(5);

      expect(service.remove).toHaveBeenCalledWith(5);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should return deletion message from service', () => {
      const mockResponse = { message: 'Ticket with ID 42 deleted successfully' };

      service.remove.mockReturnValue(mockResponse);

      const result = controller.remove(42);

      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('deleted successfully');
    });

    it('should propagate NotFoundException from service', () => {
      service.remove.mockImplementation(() => {
        throw new NotFoundException('Ticket not found');
      });

      expect(() => controller.remove(999)).toThrow(NotFoundException);
    });

    it('should handle multiple deletion attempts with different IDs', () => {
      service.remove
        .mockReturnValueOnce({ message: 'Ticket with ID 1 deleted successfully' })
        .mockReturnValueOnce({ message: 'Ticket with ID 2 deleted successfully' });

      const result1 = controller.remove(1);
      const result2 = controller.remove(2);

      expect(result1.message).toContain('ID 1');
      expect(result2.message).toContain('ID 2');
      expect(service.remove).toHaveBeenCalledTimes(2);
    });
  });
});
