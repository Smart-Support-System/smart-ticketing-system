export class CreateTicketDto {
  title!: string;
  description!: string;
  customerName!: string;
  customerEmail!: string;
  priority?: 'low' | 'medium' | 'high';
}