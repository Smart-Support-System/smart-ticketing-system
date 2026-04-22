import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'text', unique: true, nullable: false })
  email: string;
  
  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'bytea' })
  password_hash: Buffer;

  @Column({ type: 'boolean', nullable: true })
  is_approved: boolean;
}


