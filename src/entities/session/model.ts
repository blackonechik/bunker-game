import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import type { Player } from '@/entities/player/model';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'player_id', unique: true })
  playerId!: number;

  @Column({ name: 'socket_id', nullable: true })
  socketId?: string;

  @Column({ type: 'text' })
  token!: string;

  @UpdateDateColumn({ name: 'last_ping' })
  lastPing!: Date;

  @OneToOne('Player', 'session', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;
}
