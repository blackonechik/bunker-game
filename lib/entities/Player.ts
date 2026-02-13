import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Room } from './Room';
import { PlayerCard } from './PlayerCard';
import { Session } from './Session';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', length: 255 })
  userId!: string;

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

  @Column({ name: 'is_bot', default: false })
  isBot!: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;

  @ManyToOne(() => Room, (room) => room.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @OneToMany(() => PlayerCard, (playerCard) => playerCard.player)
  cards!: PlayerCard[];

  @OneToOne(() => Session, (session) => session.player)
  session?: Session;
}
