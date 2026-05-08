import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketEntity } from './ticket.entity';
import type { Ticket } from './interfaces/ticket.interface';

type CurrentUser = {
  user_id: number;
  role: 'user' | 'agent' | 'admin';
};

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
      title: ticket.title ?? '',
      description: ticket.description ?? '',
      customerName: ticket.user?.name ?? 'Unknown User',
      customerEmail: ticket.user?.email ?? 'unknown@example.com',
      priority: ticket.ticketPriority ?? 'medium',
      status: frontendStatus,
      createdAt: ticket.createdDate?.toISOString() ?? new Date().toISOString(),
    };
  }

  private async getNextTicketId(): Promise<number> {
    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketId)', 'max')
      .getRawOne<{ max: string | number | null }>();

    return (Number(result?.max) || 0) + 1;
  }

  async create(
    createTicketDto: CreateTicketDto,
    currentUser: CurrentUser,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ticketId: await this.getNextTicketId(),
      title: createTicketDto.title,
      description: createTicketDto.description,
      ticketPriority: createTicketDto.priority ?? 'medium',
      ticketStatus: 'open',
      createdDate: new Date(),
      userId: currentUser.user_id,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    const ticketWithUser = await this.ticketRepository.findOne({
      where: { ticketId: savedTicket.ticketId },
      relations: ['user'],
    });

    if (!ticketWithUser) {
      throw new NotFoundException(
        `Ticket with ID ${savedTicket.ticketId} not found`,
      );
    }

    return this.toFrontendTicket(ticketWithUser);
  }

  async findAll(currentUser: CurrentUser): Promise<Ticket[]> {
    const isStaff =
      currentUser.role === 'agent' || currentUser.role === 'admin';

    const tickets = await this.ticketRepository.find({
      where: isStaff
        ? { isArchived: false }
        : { userId: currentUser.user_id, isArchived: false },
      relations: ['user'],
      order: { createdDate: 'DESC' },
    });

    return tickets.map((ticket) => this.toFrontendTicket(ticket));
  }


  async findArchived(currentUser: CurrentUser): Promise<Ticket[]> {
    if (currentUser.role !== 'admin') {
      throw new NotFoundException('Archived tickets not found');
    }

    const tickets = await this.ticketRepository.find({
      where: { isArchived: true },
      relations: ['user'],
      order: { createdDate: 'DESC' },
    });

    return tickets.map((ticket) => this.toFrontendTicket(ticket));
  }

  async findOne(id: number, currentUser: CurrentUser): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const isOwner = ticket.userId === currentUser.user_id;
    const isStaff =
      currentUser.role === 'agent' || currentUser.role === 'admin';

    if (!isOwner && !isStaff) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return this.toFrontendTicket(ticket);
  }

  async updateStatus(
    id: number,
    updateTicketStatusDto: UpdateTicketStatusDto,
    currentUser: CurrentUser,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const isStaff =
      currentUser.role === 'agent' || currentUser.role === 'admin';

    if (!isStaff) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.ticketStatus =
      updateTicketStatusDto.status === 'in-progress'
        ? 'pending'
        : updateTicketStatusDto.status;

    const updatedTicket = await this.ticketRepository.save(ticket);

    const ticketWithUser = await this.ticketRepository.findOne({
      where: { ticketId: updatedTicket.ticketId },
      relations: ['user'],
    });

    if (!ticketWithUser) {
      throw new NotFoundException(
        `Ticket with ID ${updatedTicket.ticketId} not found`,
      );
    }

    return this.toFrontendTicket(ticketWithUser);
  }

  async updatePriority(
    id: number,
    priority: 'low' | 'medium' | 'high',
    currentUser: CurrentUser,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const isStaff =
      currentUser.role === 'agent' || currentUser.role === 'admin';

    if (!isStaff) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.ticketPriority = priority;

    const updatedTicket = await this.ticketRepository.save(ticket);

    const ticketWithUser = await this.ticketRepository.findOne({
      where: { ticketId: updatedTicket.ticketId },
      relations: ['user'],
    });

    if (!ticketWithUser) {
      throw new NotFoundException(
        `Ticket with ID ${updatedTicket.ticketId} not found`,
      );
    }

    return this.toFrontendTicket(ticketWithUser);
  }

  async archive(
    id: number,
    currentUser: CurrentUser,
  ): Promise<{ message: string }> {
    const isStaff =
      currentUser.role === 'agent' || currentUser.role === 'admin';

    if (!isStaff) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.isArchived = true;
    await this.ticketRepository.save(ticket);

    return { message: `Ticket with ID ${id} archived successfully` };
  }
  async deleteArchived(
    id: number,
    currentUser: CurrentUser,
  ): Promise<{ message: string }> {
    if (currentUser.role !== 'admin') {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id, isArchived: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Archived ticket with ID ${id} not found`);
    }

    await this.ticketRepository.delete({ ticketId: id });

    return { message: `Archived ticket with ID ${id} deleted permanently` };
  }

}
