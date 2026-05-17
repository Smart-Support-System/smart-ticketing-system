import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketEntity } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';

import { TicketChatGateway } from './ticket-chat.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity, TicketMessage])],
  controllers: [TicketsController],
  providers: [TicketsService, TicketChatGateway],
})
export class TicketsModule {}
