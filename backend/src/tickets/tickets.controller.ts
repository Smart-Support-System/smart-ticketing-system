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

// Added chat functionality import
import { CreateTicketMessageDto } from './create-ticket-message.dto';

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

  @Get('archived')
  findArchived(@Request() req): Promise<Ticket[]> {
    return this.ticketsService.findArchived(req.session.user);
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

  @Delete(':id')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.ticketsService.archive(id, req.session.user);
  }

  @Delete(':id/permanent')
  deleteArchived(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.ticketsService.deleteArchived(id, req.session.user);
  }

  // Added ticket functionality
  @Patch(':id/start-chat')
  startChat(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ticketsService.startChat(id, req.session.user);
  }

  @Get(':id/messages')
  getMessages(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ticketsService.getMessages(id, req.session.user);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTicketMessageDto,
    @Request() req,
  ) {
    return this.ticketsService.sendMessage(id, dto, req.session.user);
  }
}
