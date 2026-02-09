import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Apocalypse } from '@/entities/apocalypse/model';
import { Location } from '@/entities/location/model';
import { RoomState } from '@/shared/types';
import type { Player } from '@/entities/player/model';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 4 })
  code!: string;

  @Column({
    type: 'enum',
    enum: RoomState,
    default: RoomState.WAITING
  })
  state!: RoomState;

  @Column({ name: 'max_players', default: 10 })
  maxPlayers!: number;

  @Column({ name: 'current_round', default: 0 })
  currentRound!: number;

  @Column({ name: 'hardcore', default: false })
  hardcore!: boolean;

  @Column({ name: 'host_player_id', nullable: true })
  hostPlayerId?: number;

  @Column({ name: 'apocalypse_id', nullable: true })
  apocalypseId?: number;

  @Column({ name: 'location_id', nullable: true })
  locationId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'started_at', nullable: true })
  startedAt?: Date;

  @Column({ name: 'round_timer', nullable: true })
  roundTimer?: number;

  @OneToMany('Player', 'room')
  players!: Player[];

  @ManyToOne(() => Apocalypse, { eager: true })
  @JoinColumn({ name: 'apocalypse_id' })
  apocalypse?: Apocalypse;

  @ManyToOne(() => Location, { eager: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;
}
