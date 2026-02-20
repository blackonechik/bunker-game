'use client';

import { getAccentClasses, getCardTypeLabel } from '@/shared/lib';
import { MyCardsHudProps } from '../types';

export function MyCardsHud({ playerName, cards, canReveal, hasRevealedThisRound, onReveal }: MyCardsHudProps) {
  return (
    <div className="bg-zinc-950 border-2 border-zinc-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative">
        <div className="p-3">
          <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-zinc-100 font-black uppercase text-2xl italic tracking-tight">Ваши карты: {playerName}</h2>
              <p className="text-[10px] text-zinc-500 uppercase">За один раунд можно открыть одну карту</p>
            </div>
            <div className="text-[10px] uppercase font-bold text-zinc-400">
              {canReveal
                ? hasRevealedThisRound
                  ? 'Карта в этом раунде уже открыта'
                  : 'Откройте 1 карту в этом раунде'
                : 'Ожидание следующей фазы'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {cards.length === 0 && (
              <div className="col-span-full bg-black border border-zinc-700 p-4 text-[11px] uppercase text-zinc-500">
                Карточки еще не выданы. Ожидание раздачи...
              </div>
            )}

            {cards.map((card, index) => {
              const isRevealed = card.isRevealed;
              const canRevealThisCard = canReveal && !hasRevealedThisRound && !isRevealed;
              const accent = getAccentClasses(card.card.type);
              const isSpecial = card.card.type === 'special';

              return (
                <div
                  key={card.id}
                  className={`group relative bg-zinc-900 border-2 border-zinc-800 p-5 transition-all overflow-hidden ${accent.hudBorder}`}
                >
                  <div className={`absolute -right-4 -top-4 text-6xl font-black ${isSpecial ? 'text-green-500/20' : 'text-zinc-800'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-zinc-100 uppercase leading-none mb-3">
                      {getCardTypeLabel(card.card.type)}
                    </h3>
                    <div className={`h-px w-full mb-3 ${isSpecial ? 'bg-green-500' : 'bg-zinc-800'}`} />

                    <p className={`text-base font-bold text-zinc-400 transition-colors ${accent.hudValue}`}>
                      {card.card.value}
                    </p>

                    <div className={`mt-3 text-[9px] uppercase font-bold ${
                      isRevealed ? 'text-green-500' : 'text-zinc-500'
                    }`}>
                      {isRevealed ? 'Открыта' : 'Скрыта'}
                    </div>
                  </div>

                  {canRevealThisCard && (
                    <button
                      type="button"
                      onClick={() => onReveal(card.id)}
                      className="mt-4 w-full px-2 py-2 bg-green-600 border border-green-400 text-black text-[10px] uppercase font-bold hover:bg-green-400 transition-all relative z-10"
                    >
                      Открыть
                    </button>
                  )}

                  <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${accent.hudBar}`} />
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
