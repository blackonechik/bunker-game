'use client';

import { PlayerCardDTO } from '@/shared/types';
import { getAccentClasses, getCardTypeLabel } from '@/shared/lib';

interface PlayerCardsListProps {
  cards: PlayerCardDTO[];
  hiddenSlots?: number;
  containerClassName?: string;
}

export function PlayerCardsList({
  cards,
  hiddenSlots = 0,
  containerClassName = 'grid grid-cols-1 gap-1 text-[10px] uppercase font-bold',
}: PlayerCardsListProps) {
  return (
    <div className={containerClassName}>
      {cards.map((displayCard) => (
        <div
          key={displayCard.id}
          className={`p-2 border truncate ${getAccentClasses(displayCard.card.type).listItem}`}
        >
          {getCardTypeLabel(displayCard.card.type)}: {displayCard.card.value}
        </div>
      ))}

      {Array.from({ length: Math.max(0, hiddenSlots) }).map((_, hiddenIndex) => (
        <div key={`hidden-${hiddenIndex}`} className="bg-zinc-950 p-2 border border-zinc-800 text-zinc-600">
          ???
        </div>
      ))}
    </div>
  );
}
