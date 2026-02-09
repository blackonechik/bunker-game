import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { VoteType } from '@/shared/types';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_id' })
  roomId!: number;

  @Column()
  round!: number;

  @Column({
    type: 'enum',
    enum: VoteType
  })
  type!: VoteType;

  @Column({ name: 'voter_id' })
  voterId!: number;

  @Column({ name: 'target_id' })
  targetId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
