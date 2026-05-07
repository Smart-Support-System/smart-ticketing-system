import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import type { Ticket } from './interfaces/ticket.interface';
import { TicketsService } from './tickets.service';

@UseGuards(AuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Request() req): Promise<Ticket> {
    return this.ticketsService.create(createTicketDto, req.session.user);
  }

  @Get()
  findAll(@Request() req): Promise<Ticket[]> {
    return this.ticketsService.findAll(req.session.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Ticket> {
    return this.ticketsService.findOne(id, req.session.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @Request() req,
  ): Promise<Ticket> {
    return this.ticketsService.updateStatus(
      id,
      updateTicketStatusDto,
      req.session.user,
    );
  }

  @Patch(':id/priority')
  updatePriority(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { priority: 'low' | 'medium' | 'high' },
    @Request() req,
  ): Promise<Ticket> {
    return this.ticketsService.updatePriority(
      id,
      body.priority,
      req.session.user,
    );
  }

  @Delete(':id')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.ticketsService.archive(id, req.session.user);
  }
}