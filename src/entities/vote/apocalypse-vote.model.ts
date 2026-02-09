import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('apocalypse_votes')
export class ApocalypseVote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_id' })
  roomId!: number;

  @Column({ name: 'player_id' })
  playerId!: number;

  @Column({ name: 'apocalypse_id' })
  apocalypseId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
