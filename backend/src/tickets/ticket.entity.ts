import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { TicketMessage } from './ticket-message.entity';

@Entity('tickets')
export class TicketEntity {
  @PrimaryColumn({ name: 'ticket_id', type: 'integer' })
  ticketId!: number;

  @Column({ type: 'text', nullable: true })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'created_date', type: 'timestamptz', nullable: true })
  createdDate!: Date;

  @Column({
    name: 'ticket_priority',
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    enumName: 'priority',
    nullable: true,
  })
  ticketPriority!: 'low' | 'medium' | 'high';

  @Column({
    name: 'ticket_status',
    type: 'enum',
    enum: ['new', 'open', 'pending', 'closed', 'withdrawn'],
    enumName: 'status',
    nullable: true,
  })
  ticketStatus!: 'new' | 'open' | 'pending' | 'closed' | 'withdrawn';

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'is_archived', type: 'boolean', default: false })
  isArchived!: boolean;

  // Added chat field entity
  @Column({ name: 'chat_started', type: 'boolean', default: false })
  chatStarted!: boolean;

  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages!: TicketMessage[];
}