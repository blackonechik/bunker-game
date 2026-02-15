'use client';

import Link from 'next/link';
import { PlayerCardsList } from './PlayerCardsList';
import { VictoryScreenProps } from '../types';

export function VictoryScreen({ winners }: VictoryScreenProps) {
  const displayedWinners = winners.slice(0, 2);

  return (
    <div className="bg-zinc-950 text-zinc-300 font-mono">
      <header className="px-6 pt-12 pb-6 border-b border-zinc-800">
        <h1 className="text-5xl max-md:text-4xl font-black text-emerald-500 uppercase italic tracking-tight">Победа</h1>
        <p className="text-zinc-500 text-sm mt-2 uppercase">В бункере осталось 2 выживших</p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
          {displayedWinners.map((winner, index) => (
            <section key={winner.id} className="bg-zinc-900 border-2 border-zinc-800 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 border border-emerald-500 flex items-center justify-center text-emerald-500 font-bold">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 uppercase">{winner.name}</h2>
                  <p className="text-[10px] text-zinc-500 uppercase">Выживший</p>
                </div>
              </div>

              <PlayerCardsList cards={winner.cards || []} />
            </section>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 border-2 border-emerald-500 text-emerald-400 uppercase font-bold tracking-wide hover:bg-emerald-500 hover:text-black transition-colors"
          >
            Вернуться в главное меню
          </Link>
        </div>
      </main>
    </div>
  );
}
