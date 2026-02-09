import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { CardType } from '@/shared/types';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: CardType
  })
  type!: CardType;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, nullable: true })
  rarity?: string;
}
