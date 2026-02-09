import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Card } from '@/entities/card/model';
import type { Player } from './model';

@Entity('player_cards')
export class PlayerCard {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'player_id' })
  playerId!: number;

  @Column({ name: 'card_id' })
  cardId!: number;

  @Column({ name: 'is_revealed', default: false })
  isRevealed!: boolean;

  @Column({ name: 'revealed_at', nullable: true })
  revealedAt?: Date;

  @Column({ name: 'revealed_round', nullable: true })
  revealedRound?: number;

  @ManyToOne('Player', 'cards', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Card, { eager: true })
  @JoinColumn({ name: 'card_id' })
  card!: Card;
}
