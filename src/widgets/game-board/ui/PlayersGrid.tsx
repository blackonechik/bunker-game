'use client';

import { Button } from '@/shared/ui';
import { PlayerCardsList } from './PlayerCardsList';
import { PlayersGridProps } from '../types';

export function PlayersGrid({
  players,
  currentPlayerId,
  canVote,
  onVote,
  selectedTargetPlayerId = null,
  isSubmittingVote = false,
  liveVotes = [],
}: PlayersGridProps) {
  const currentPlayer = players.find((player) => player.id === currentPlayerId);
  const isCurrentPlayerAlive = currentPlayer?.isAlive ?? true;
  const liveVotesByTarget = new Map(liveVotes.map((vote) => [vote.targetPlayerId, vote.voters]));

  return (
    <section className="grid grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1 gap-3">
      {players.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isEliminated = !player.isAlive;
        const isSelectedVoteTarget = player.id === selectedTargetPlayerId;
        const voteAvatars = liveVotesByTarget.get(player.id) || [];
        const allCards = player.cards || [];
        const revealedCards = allCards.filter((card) => card.isRevealed);
        const cardsToShow = isEliminated ? allCards : revealedCards.slice(0, 6);

        return (
          <article
            key={player.id}
            className={`bg-zinc-900 border-2 p-2 relative transition-all ${
              isEliminated
                ? 'border-zinc-900 grayscale opacity-60'
                : isSelectedVoteTarget
                ? 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                : isCurrentPlayer
                ? 'border-green-900 shadow-[0_0_18px_rgba(34,197,94,0.15)]'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {isSelectedVoteTarget && !isEliminated && (
              <div className="absolute left-3 top-3 z-10 border border-emerald-500/70 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                Ваш голос
              </div>
            )}

            {isEliminated && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="text-red-600 font-black text-3xl border-4 border-red-600 p-2 rotate-12 opacity-80 uppercase">
                  ВЫГНАН
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
                {player.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={isCurrentPlayer ? 'text-green-500 font-bold' : 'text-zinc-500 font-bold'}>
                    {player.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className={isCurrentPlayer ? 'font-bold text-zinc-100' : 'font-bold text-zinc-300'}>
                  {player.name} {isCurrentPlayer ? '(Вы)' : ''}
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase">
                  {isEliminated ? 'Статус: ВЫГНАН' : player.isOnline ? 'Статус: Выживший' : 'Статус: Оффлайн'}
                </p>
              </div>
            </div>

            <PlayerCardsList
              cards={cardsToShow}
              hiddenSlots={isEliminated ? 0 : Math.max(0, 8 - revealedCards.length)}
            />

            {voteAvatars.length > 0 && !isEliminated && (
              <div className="mt-4">
                <div className="flex items-center">
                  {voteAvatars.map((voter, avatarIndex) => (
                    <div
                      key={voter.playerId}
                      className={`relative h-8 w-8 overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 ${avatarIndex === 0 ? '' : '-ml-3'}`}
                      title={voter.name}
                    >
                      {voter.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={voter.image}
                          alt={voter.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] font-black uppercase text-zinc-300">
                          {voter.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isCurrentPlayerAlive && !isEliminated && (
              <Button
                disabled={(!canVote && !isSelectedVoteTarget) || isCurrentPlayer || isEliminated || (isSubmittingVote && !isSelectedVoteTarget)}
                onClick={() => onVote(player.id)}
                size="small"
                variant={isSelectedVoteTarget ? 'primary' : 'secondary'}
                className={`mt-4 w-full !text-[10px] !tracking-widest ${
                  isSelectedVoteTarget
                    ? '!border-emerald-500 !bg-emerald-500/10 !text-emerald-300 hover:!bg-emerald-500/20'
                    : '!border-red-900 !text-red-500 !bg-red-950 hover:!bg-red-900 hover:!text-white'
                } disabled:!opacity-40`}
              >
                {isSelectedVoteTarget ? 'Голос учтён' : isSubmittingVote ? 'Отправка...' : 'Проголосовать'}
              </Button>
            )}
          </article>
        );
      })}
    </section>
  );
}
