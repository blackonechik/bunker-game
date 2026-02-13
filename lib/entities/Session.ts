import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Player } from './Player';

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

  @OneToOne(() => Player, (player) => player.session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Relation<Player>;
}
