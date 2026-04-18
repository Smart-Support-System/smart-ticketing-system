import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import type { Ticket } from './interfaces/ticket.interface';

@Injectable()
export class TicketsService {
  private tickets: Ticket[] = [];
  private nextId = 1;

  create(createTicketDto: CreateTicketDto): Ticket {
    const newTicket: Ticket = {
      id: this.nextId++,
      title: createTicketDto.title,
      description: createTicketDto.description,
      customerName: createTicketDto.customerName,
      customerEmail: createTicketDto.customerEmail,
      priority: createTicketDto.priority ?? 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    this.tickets.push(newTicket);
    return newTicket;
  }

  findAll(): Ticket[] {
    return this.tickets;
  }

  findOne(id: number): Ticket {
    const ticket = this.tickets.find((t) => t.id === id);

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  updateStatus(id: number, updateTicketStatusDto: UpdateTicketStatusDto): Ticket {
    const ticket = this.findOne(id);
    ticket.status = updateTicketStatusDto.status;
    return ticket;
  }
}