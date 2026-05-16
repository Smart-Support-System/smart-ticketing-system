import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TicketsService } from './tickets.service';
import { CreateTicketMessageDto } from './create-ticket-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:58509'],
    credentials: true,
  },
})
export class TicketChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly ticketsService: TicketsService) {}

  @SubscribeMessage('joinTicketChat')
  handleJoinTicketChat(
    @MessageBody() data: { ticketId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ticket-${data.ticketId}`);
  }

  @SubscribeMessage('sendTicketMessage')
  async handleSendTicketMessage(
    @MessageBody()
    data: {
      ticketId: number;
      messageText: string;
      currentUser: {
        user_id: number;
        role: 'user' | 'agent' | 'admin';
      };
    },
  ) {
    const dto: CreateTicketMessageDto = {
      messageText: data.messageText,
    };

    const savedMessage = await this.ticketsService.sendMessage(
      data.ticketId,
      dto,
      data.currentUser,
    );

    this.server
      .to(`ticket-${data.ticketId}`)
      .emit('ticketMessageReceived', savedMessage);

    return savedMessage;
  }

  @SubscribeMessage('startTicketChat')
  async handleStartTicketChat(
    @MessageBody()
    data: {
        ticketId: number;
        currentUser: {
        user_id: number;
        role: 'user' | 'agent' | 'admin';
        };
    },
  ) {
    const updatedTicket = await this.ticketsService.startChat(
        data.ticketId,
        data.currentUser,
    );

    this.server
        .to(`ticket-${data.ticketId}`)
        .emit('ticketChatStarted', updatedTicket);

    return updatedTicket;
  }
}