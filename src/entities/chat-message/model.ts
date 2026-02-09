import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_id' })
  roomId!: number;

  @Column({ name: 'player_id', nullable: true })
  playerId?: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ length: 20, default: 'user' })
  type!: 'user' | 'system';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
