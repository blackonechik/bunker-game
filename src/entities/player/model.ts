import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import type { Room } from '@/entities/room/model';
import type { PlayerCard } from './player-card.model';
import type { Session } from '@/entities/session/model';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name!: string;

  @Column({ name: 'room_id' })
  roomId!: number;

  @Column({ name: 'is_alive', default: true })
  isAlive!: boolean;

  @Column({ name: 'is_host', default: false })
  isHost!: boolean;

  @Column({ name: 'is_online', default: true })
  isOnline!: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @ManyToOne('Room', 'players', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @OneToMany('PlayerCard', 'player')
  cards!: PlayerCard[];

  @OneToOne('Session', 'player')
  session?: Session;
}
