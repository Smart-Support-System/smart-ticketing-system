export type TicketStatus = 'open' | 'in-progress' | 'closed';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  priority: 'low' | 'medium' | 'high';
  status: TicketStatus;
  createdAt: string;
  chatStarted: boolean;
}