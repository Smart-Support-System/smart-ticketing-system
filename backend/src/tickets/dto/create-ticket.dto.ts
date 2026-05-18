import { TicketPriority } from '../interfaces/ticket.interface';

export class CreateTicketDto {
  title!: string;
  description!: string;
  customerName!: string;
  customerEmail!: string;
  priority?: TicketPriority;
}
