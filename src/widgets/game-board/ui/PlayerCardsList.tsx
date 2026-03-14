'use client';

import { useEffect, useRef, useState } from 'react';
import { getAccentClasses, getCardTypeLabel } from '@/shared/lib';
import { PlayerCardsListProps } from '../types';

function ScrollingCardText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const updateOverflow = () => {
      const container = containerRef.current;
      const content = contentRef.current;

      if (!container || !content) {
        return;
      }

      setIsOverflowing(content.scrollWidth > container.clientWidth + 4);
    };

    updateOverflow();
    window.addEventListener('resize', updateOverflow);

    return () => {
      window.removeEventListener('resize', updateOverflow);
    };
  }, [text]);

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className="min-w-0 overflow-hidden">
        <div ref={contentRef} className="whitespace-nowrap">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-w-0 overflow-hidden">
      <div className="flex w-max min-w-full animate-[player-card-marquee_16s_ease-in-out_infinite] whitespace-nowrap">
        <div ref={contentRef} className="pr-8">
          {text}
        </div>
        <div aria-hidden="true" className="pr-8">
          {text}
        </div>
      </div>
    </div>
  );
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
          className={`p-2 border overflow-hidden ${getAccentClasses(displayCard.card.type).listItem}`}
        >
          <ScrollingCardText text={`${getCardTypeLabel(displayCard.card.type)}: ${displayCard.card.value}`} />
        </div>
      ))}

      {Array.from({ length: Math.max(0, hiddenSlots) }).map((_, hiddenIndex) => (
        <div key={`hidden-${hiddenIndex}`} className="bg-zinc-950 p-2 border border-zinc-800 text-zinc-600">
          ???
        </div>
      ))}

      <style jsx>{`
        @keyframes player-card-marquee {
          0%,
          15% {
            transform: translateX(0);
          }
          85%,
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
