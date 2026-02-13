import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { Card } from './Card';
import { Player } from './Player';

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

  @ManyToOne(() => Player, (player) => player.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Relation<Player>;

  @ManyToOne(() => Card, { eager: true })
  @JoinColumn({ name: 'card_id' })
  card!: Relation<Card>;
}
