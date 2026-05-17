import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { TicketEntity } from './ticket.entity';
import { User } from '../users/users.entity';

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn({ name: 'message_id' })
  messageId!: number;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: TicketEntity;

  @Column({ name: 'ticket_id', type: 'integer' })
  ticketId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender!: User;

  @Column({ name: 'sender_user_id', type: 'integer' })
  senderUserId!: number;

  @Column({ name: 'message_text', type: 'text' })
  messageText!: string;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
