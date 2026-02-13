'use client';

import { motion } from 'framer-motion';
import { PlayerCardDTO } from '@/shared/types';
import { getCardTypeLabel } from '@/shared/lib';

interface PlayerCardProps {
  card: PlayerCardDTO;
  onReveal?: () => void;
  canReveal?: boolean;
}

export function PlayerCard({ card, onReveal, canReveal = false }: PlayerCardProps) {
  const getBorderColor = () => {
    switch (card.card.type) {
      case 'profession':
        return 'border-emerald-500';
      case 'health':
        return 'border-red-500';
      case 'phobia':
        return 'border-purple-500';
      case 'inventory':
        return 'border-blue-500';
      case 'trait':
        return 'border-yellow-500';
      case 'hobby':
        return 'border-cyan-500';
      case 'age':
        return 'border-orange-500';
      case 'special':
        return 'border-pink-500';
      default:
        return 'border-zinc-700';
    }
  };

  const typeLabel = getCardTypeLabel(card.card.type);

  if (!card.isRevealed) {
    return (
      <motion.div
        whileHover={canReveal ? { scale: 1.05 } : {}}
        className={`min-w-[200px] md:min-w-0 snap-center p-4 bg-zinc-900 border-t-4 ${getBorderColor()} shadow-xl relative overflow-hidden group cursor-pointer`}
      >
        <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2">
          {typeLabel}
        </div>
        
        <div className="text-xl font-black uppercase text-zinc-600 mb-4 blur-sm select-none">
          {card.card.value}
        </div>

        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center opacity-100">
          {canReveal && onReveal ? (
            <button
              onClick={onReveal}
              className="px-4 py-1 text-[9px] border border-zinc-500 text-zinc-500 uppercase font-black hover:bg-white hover:text-black transition-all"
            >
              Open
            </button>
          ) : (
            <div className="text-[9px] text-zinc-600 uppercase font-black">
              Hidden
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const isSpecial = card.card.rarity === 'legendary' || card.card.rarity === 'epic';

  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`min-w-[200px] md:min-w-0 snap-center p-4 ${isSpecial ? 'bg-emerald-950' : 'bg-zinc-900'} border-t-4 ${getBorderColor()} shadow-xl group hover:-translate-y-2 transition-transform duration-300 ${isSpecial ? 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}
    >
      <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2">
        {typeLabel}
      </div>
      
      <div className="text-xl font-black uppercase text-white mb-4">
        {card.card.value}
      </div>

      {card.card.description && (
        <div className={`text-[10px] uppercase italic ${isSpecial ? 'text-emerald-300' : 'text-emerald-500'} leading-tight`}>
          {card.card.description}
        </div>
      )}

      <div className="mt-4 w-full py-1 text-[9px] bg-emerald-500 text-black uppercase font-black text-center">
        Revealed
      </div>
    </motion.div>
  );
}
