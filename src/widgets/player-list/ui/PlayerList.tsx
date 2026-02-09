'use client';

import { motion } from 'framer-motion';
import { PlayerDTO } from '@/shared/types';

interface PlayerListProps {
  players: PlayerDTO[];
  currentPlayerId?: number;
  onVote?: (playerId: number) => void;
  canVote?: boolean;
  speakingPlayerId?: number;
}

export function PlayerList({ players, currentPlayerId, onVote, canVote = false, speakingPlayerId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => {
        const isYou = player.id === currentPlayerId;
        const isSpeaking = player.id === speakingPlayerId;
        const isEliminated = !player.isAlive;
        const revealedCards = player.cards?.filter(c => c.isRevealed) || [];

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isEliminated ? 0.4 : 1, x: 0 }}
            className={`flex items-center gap-4 p-3 ${
              isSpeaking 
                ? 'bg-amber-500 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : isEliminated
                ? 'bg-zinc-950 border border-red-900 grayscale'
                : isYou
                ? 'border border-emerald-500 bg-emerald-500/10'
                : 'bg-zinc-900 border border-zinc-800'
            } ${canVote && !isYou && !isEliminated ? 'hover:border-zinc-600 cursor-pointer' : ''} transition-all`}
            onClick={() => canVote && !isYou && !isEliminated && onVote?.(player.id)}
          >
            {/* Аватар */}
            <div className={`w-10 h-10 ${
              isSpeaking 
                ? 'bg-amber-500 text-black' 
                : isEliminated 
                ? 'bg-red-900 border-2 border-red-900 text-red-900'
                : isYou
                ? 'bg-emerald-500 border-2 border-emerald-500 text-black'
                : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400'
            } flex items-center justify-center font-black text-xs`}>
              {isEliminated ? 'X' : player.name.substring(0, 2).toUpperCase()}
            </div>

            {/* Информация */}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm ${isEliminated ? 'line-through' : ''} ${isSpeaking ? 'text-amber-500 italic uppercase' : ''}`}>
                  {player.name} {isYou && '(Вы)'}
                </span>
                {isSpeaking && (
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-amber-500 animate-[bounce_1s_infinite]"></div>
                    <div className="w-1 h-3 bg-amber-500 animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-1 h-3 bg-amber-500 animate-[bounce_1s_infinite_400ms]"></div>
                  </div>
                )}
                {!isSpeaking && (
                  <span className={`text-[10px] font-bold uppercase ${
                    isEliminated ? 'text-red-500' : isYou ? 'text-emerald-500' : 'text-zinc-500'
                  }`}>
                    {isEliminated ? 'Excluded' : isYou ? 'You' : 'Safe'}
                  </span>
                )}
              </div>

              {/* Открытые карты */}
              {revealedCards.length > 0 && (
                <div className="text-[10px] text-zinc-500 uppercase truncate mt-1">
                  {revealedCards.map(c => c.card.value).join(' • ')}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
