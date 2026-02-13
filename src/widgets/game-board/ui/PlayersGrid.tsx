'use client';

import { PlayerDTO } from '@/shared/types';

interface PlayersGridProps {
  players: PlayerDTO[];
  currentPlayerId?: number;
  canVote: boolean;
  onVote: (targetPlayerId: number) => void;
}

export function PlayersGrid({ players, currentPlayerId, canVote, onVote }: PlayersGridProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {players.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isEliminated = !player.isAlive;
        const revealedCards = player.cards?.filter((card) => card.isRevealed) || [];

        return (
          <article
            key={player.id}
            className={`bg-zinc-900 border-2 p-4 relative transition-all ${
              isEliminated
                ? 'border-zinc-900 grayscale opacity-60'
                : isCurrentPlayer
                ? 'border-green-900 shadow-[0_0_18px_rgba(34,197,94,0.15)]'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {isEliminated && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="text-red-600 font-black text-3xl border-4 border-red-600 p-2 rotate-12 opacity-80 uppercase">
                  Exiled
                </span>
              </div>
            )}

            <div className={`absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full border-4 border-zinc-950 font-bold text-xs ${
              isCurrentPlayer ? 'bg-green-600 text-black' : isEliminated ? 'bg-zinc-700 text-black' : 'bg-zinc-700 text-black'
            }`}>
              {String(index + 1).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 border-2 flex items-center justify-center ${
                isCurrentPlayer ? 'bg-green-900 border-green-700' : 'bg-zinc-800 border-zinc-700'
              }`}>
                <span className={isCurrentPlayer ? 'text-green-500 font-bold' : 'text-zinc-500 font-bold'}>
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className={isCurrentPlayer ? 'font-bold text-zinc-100' : 'font-bold text-zinc-300'}>
                  {player.name} {isCurrentPlayer ? '(Вы)' : ''}
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase">
                  {isEliminated ? 'Status: Exiled' : player.isOnline ? 'Status: Survivor' : 'Status: Offline'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
              {revealedCards.slice(0, 6).map((revealedCard) => (
                <div key={revealedCard.id} className="bg-zinc-800 p-2 border border-green-900 text-green-500 truncate">
                  {revealedCard.card.type}: {revealedCard.card.value}
                </div>
              ))}

              {Array.from({ length: Math.max(0, 6 - revealedCards.length) }).map((_, hiddenIndex) => (
                <div key={`hidden-${player.id}-${hiddenIndex}`} className="bg-zinc-950 p-2 border border-zinc-800 text-zinc-600">
                  ???
                </div>
              ))}
            </div>

            <button
              aria-label="Vote for Expulsion"
              disabled={!canVote || isCurrentPlayer || isEliminated}
              onClick={() => onVote(player.id)}
              className="mt-4 w-full py-1 text-[10px] border uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-red-950 text-red-500 border-red-900 hover:bg-red-900 hover:text-white"
            >
              Vote Out
            </button>
          </article>
        );
      })}
    </section>
  );
}
