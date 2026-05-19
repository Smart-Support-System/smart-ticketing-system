export type TicketStatus = 'open' | 'in-progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  chatStarted: boolean;
}
