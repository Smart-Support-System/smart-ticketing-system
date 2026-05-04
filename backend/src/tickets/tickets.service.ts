import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketEntity } from './ticket.entity';
import type { Ticket } from './interfaces/ticket.interface';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

  private toFrontendTicket(ticket: TicketEntity): Ticket {
    let frontendStatus: Ticket['status'];

    if (ticket.ticketStatus === 'pending') {
      frontendStatus = 'in-progress';
    } else if (ticket.ticketStatus === 'closed') {
      frontendStatus = 'closed';
    } else {
      frontendStatus = 'open';
    }

    return {
      id: ticket.ticketId,
      title: ticket.title,
      description: ticket.description,
      customerName: 'Unknown User',
      customerEmail: 'unknown@example.com',
      priority: ticket.ticketPriority ?? 'medium',
      status: frontendStatus,
      createdAt: ticket.createdDate?.toISOString() ?? new Date().toISOString(),
    };
}

  private async getNextTicketId(): Promise<number> {
    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketId)', 'max')
      .getRawOne<{ max: number | null }>();

    return (Number(result?.max) || 0) + 1;
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ticketId: await this.getNextTicketId(),
      title: createTicketDto.title,
      description: createTicketDto.description,
      ticketPriority: createTicketDto.priority ?? 'medium',
      ticketStatus: 'open',
      createdDate: new Date(),
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.toFrontendTicket(savedTicket);
  }

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.ticketRepository.find({
      order: { createdDate: 'DESC' },
    });

    return tickets.map((ticket) => this.toFrontendTicket(ticket));
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return this.toFrontendTicket(ticket);
  }

  async updateStatus(
    id: number,
    updateTicketStatusDto: UpdateTicketStatusDto,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.ticketStatus =
      updateTicketStatusDto.status === 'in-progress'
        ? 'pending'
        : updateTicketStatusDto.status;

    const updatedTicket = await this.ticketRepository.save(ticket);
    return this.toFrontendTicket(updatedTicket);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.ticketRepository.delete({ ticketId: id });

    if (result.affected === 0) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return { message: `Ticket with ID ${id} deleted successfully` };
  }
}