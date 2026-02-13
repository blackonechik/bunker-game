'use client';

import { PlayerCardDTO } from '@/shared/types';

interface MyCardsHudProps {
  playerName: string;
  cards: PlayerCardDTO[];
  canReveal: boolean;
  hasRevealedThisRound: boolean;
  onReveal: (cardId: number) => void;
}

const cardTypeLabel: Record<string, string> = {
  profession: 'Profession',
  health: 'Health',
  age: 'Age',
  hobby: 'Hobby',
  inventory: 'Baggage',
  trait: 'Trait',
  special: 'Fact',
  phobia: 'Phobia',
};

export function MyCardsHud({ playerName, cards, canReveal, hasRevealedThisRound, onReveal }: MyCardsHudProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-6xl mx-auto bg-zinc-900 border-t-4 border-orange-600 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto relative">
        <div className="p-6">
          <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-orange-500 font-black uppercase text-xl italic">Personnel File: {playerName}</h2>
              <p className="text-[10px] text-zinc-500 uppercase">Biometric Auth: Verified | Access Level: Delta</p>
            </div>
            <div className="text-[10px] uppercase font-bold text-zinc-400">
              {canReveal
                ? hasRevealedThisRound
                  ? 'Карта в этом раунде уже открыта'
                  : 'Откройте 1 карту в этом раунде'
                : 'Ожидание следующей фазы'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {cards.length === 0 && (
              <div className="col-span-full bg-black border border-zinc-700 p-4 text-[11px] uppercase text-zinc-500">
                Карточки еще не выданы. Ожидание раздачи...
              </div>
            )}

            {cards.map((card) => {
              const isRevealed = card.isRevealed;
              const canRevealThisCard = canReveal && !hasRevealedThisRound && !isRevealed;

              return (
                <div key={card.id} className="bg-black border border-zinc-700 p-3 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 text-[8px] px-1 font-bold uppercase ${
                    isRevealed ? 'bg-green-600 text-black' : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {isRevealed ? 'Public' : 'Secret'}
                  </div>

                  <p className="text-zinc-500 text-[9px] uppercase mb-1">
                    {cardTypeLabel[card.card.type] || card.card.type}
                  </p>

                  <p className="text-zinc-100 font-bold text-xs">
                    {card.card.value}
                  </p>

                  {canRevealThisCard && (
                    <button
                      type="button"
                      onClick={() => onReveal(card.id)}
                      className="mt-3 w-full px-2 py-1 bg-orange-600 border border-orange-400 text-black text-[10px] uppercase font-bold hover:bg-orange-400 transition-all"
                    >
                      Reveal
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
