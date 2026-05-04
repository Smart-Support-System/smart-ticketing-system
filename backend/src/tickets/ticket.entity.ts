import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tickets')
export class TicketEntity {
  @PrimaryColumn({ name: 'ticket_id', type: 'integer' })
  ticketId: number;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'created_date', type: 'timestamptz', nullable: true })
  createdDate: Date;

  @Column({
    name: 'ticket_priority',
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    enumName: 'priority',
    nullable: true,
  })
  ticketPriority: 'low' | 'medium' | 'high';

  @Column({
    name: 'ticket_status',
    type: 'enum',
    enum: ['new', 'open', 'pending', 'closed', 'withdrawn'],
    enumName: 'status',
    nullable: true,
  })
  ticketStatus: 'new' | 'open' | 'pending' | 'closed' | 'withdrawn';
}