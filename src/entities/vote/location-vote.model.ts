import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('location_votes')
export class LocationVote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_id' })
  roomId!: number;

  @Column({ name: 'player_id' })
  playerId!: number;

  @Column({ name: 'location_id' })
  locationId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
