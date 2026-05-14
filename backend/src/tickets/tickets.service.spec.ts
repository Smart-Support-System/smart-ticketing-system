import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import type { Ticket } from './interfaces/ticket.interface';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketsService],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe('create', () => {
    it('should create a ticket with all required fields', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Login Issue',
        description: 'Cannot log in with email',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        priority: 'high',
      };

      const result = service.create(createTicketDto);

      expect(result).toEqual({
        id: 1,
        title: 'Login Issue',
        description: 'Cannot log in with email',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        priority: 'high',
        status: 'open',
        createdAt: expect.any(String),
      });
    });

    it('should create a ticket with default priority when not provided', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'Feature Request',
        description: 'Add dark mode',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
      };

      const result = service.create(createTicketDto);

      expect(result.priority).toBe('medium');
      expect(result.status).toBe('open');
    });

    it('should increment ticket ID for each created ticket', () => {
      const ticket1 = service.create({
        title: 'Ticket 1',
        description: 'desc',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
      });

      const ticket2 = service.create({
        title: 'Ticket 2',
        description: 'desc',
        customerName: 'Customer 2',
        customerEmail: 'customer2@example.com',
      });

      expect(ticket2.id).toBe(ticket1.id + 1);
    });

    it('should set createdAt to current timestamp', () => {
      const beforeCreate = new Date();
      const result = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });
      const afterCreate = new Date();

      const createdAt = new Date(result.createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('findAll', () => {
    it('should return empty array when no tickets exist', () => {
      const result = service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all created tickets', () => {
      const ticket1 = service.create({
        title: 'Ticket 1',
        description: 'desc',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
      });

      const ticket2 = service.create({
        title: 'Ticket 2',
        description: 'desc',
        customerName: 'Customer 2',
        customerEmail: 'customer2@example.com',
      });

      const result = service.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContain(ticket1);
      expect(result).toContain(ticket2);
    });
  });

  describe('findOne', () => {
    it('should find a ticket by ID', () => {
      const created = service.create({
        title: 'Test Ticket',
        description: 'desc',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        priority: 'low',
      });

      const result = service.findOne(created.id);

      expect(result).toEqual(created);
    });

    it('should throw NotFoundException when ticket does not exist', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
      expect(() => service.findOne(999)).toThrow(
        'Ticket with ID 999 not found',
      );
    });

    it('should find correct ticket among multiple tickets', () => {
      const ticket1 = service.create({
        title: 'Ticket 1',
        description: 'desc',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
      });

      service.create({
        title: 'Ticket 2',
        description: 'desc',
        customerName: 'Customer 2',
        customerEmail: 'customer2@example.com',
      });

      const ticket3 = service.create({
        title: 'Ticket 3',
        description: 'desc',
        customerName: 'Customer 3',
        customerEmail: 'customer3@example.com',
      });

      const result = service.findOne(ticket3.id);

      expect(result).toEqual(ticket3);
      expect(result.id).not.toBe(ticket1.id);
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status', () => {
      const created = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });

      const updateDto: UpdateTicketStatusDto = { status: 'in-progress' };
      const result = service.updateStatus(created.id, updateDto);

      expect(result.status).toBe('in-progress');
      expect(result.id).toBe(created.id);
    });

    it('should persist status update in subsequent fetches', () => {
      const created = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });

      service.updateStatus(created.id, { status: 'closed' });
      const fetched = service.findOne(created.id);

      expect(fetched.status).toBe('closed');
    });

    it('should throw NotFoundException when updating non-existent ticket', () => {
      expect(() =>
        service.updateStatus(999, { status: 'closed' }),
      ).toThrow(NotFoundException);
    });

    it('should support updating to all valid status values', () => {
      const created = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });

      const statuses: Array<'open' | 'in-progress' | 'closed'> = [
        'open',
        'in-progress',
        'closed',
      ];

      for (const status of statuses) {
        const result = service.updateStatus(created.id, { status });
        expect(result.status).toBe(status);
      }
    });
  });

  describe('remove', () => {
    it('should remove a ticket by ID', () => {
      const created = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });

      const result = service.remove(created.id);

      expect(result).toEqual({
        message: `Ticket with ID ${created.id} deleted successfully`,
      });
    });

    it('should actually remove the ticket from storage', () => {
      const created = service.create({
        title: 'Test',
        description: 'desc',
        customerName: 'Customer',
        customerEmail: 'test@example.com',
      });

      service.remove(created.id);

      expect(() => service.findOne(created.id)).toThrow(NotFoundException);
    });

    it('should remove only the specified ticket', () => {
      const ticket1 = service.create({
        title: 'Ticket 1',
        description: 'desc',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
      });

      const ticket2 = service.create({
        title: 'Ticket 2',
        description: 'desc',
        customerName: 'Customer 2',
        customerEmail: 'customer2@example.com',
      });

      service.remove(ticket1.id);

      const remaining = service.findAll();

      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toEqual(ticket2);
    });

    it('should throw NotFoundException when removing non-existent ticket', () => {
      expect(() => service.remove(999)).toThrow(NotFoundException);
      expect(() => service.remove(999)).toThrow(
        'Ticket with ID 999 not found',
      );
    });
  });
});
