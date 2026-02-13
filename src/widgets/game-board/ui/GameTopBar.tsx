'use client';

import { RoomState } from '@/shared/types';

interface GameTopBarProps {
  round: number;
  state?: RoomState;
  timer: number;
  apocalypseName?: string;
  locationName?: string;
  gameDurationSeconds: number;
  alivePlayersCount: number;
  totalPlayersCount: number;
}

const DISCUSSION_DURATION = 60;

const phaseLabelMap: Record<RoomState, string> = {
  [RoomState.WAITING]: 'Ожидание',
  [RoomState.APOCALYPSE_VOTE]: 'Голосование: апокалипсис',
  [RoomState.LOCATION_VOTE]: 'Голосование: локация',
  [RoomState.DEALING]: 'Раздача карт',
  [RoomState.ROUND_START]: 'Старт раунда',
  [RoomState.CARD_REVEAL]: 'Открытие карт',
  [RoomState.DISCUSSION]: 'Обсуждение',
  [RoomState.VOTING]: 'Голосование за исключение',
  [RoomState.ELIMINATION]: 'Исключение',
  [RoomState.FINISHED]: 'Игра завершена',
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function GameTopBar({ round, state, timer, apocalypseName, locationName, gameDurationSeconds, alivePlayersCount, totalPlayersCount }: GameTopBarProps) {
  const normalizedTimer = Math.max(0, Math.min(DISCUSSION_DURATION, timer));
  const progress = (normalizedTimer / DISCUSSION_DURATION) * 100;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;
  const isUrgent = normalizedTimer <= 10;

  return (
    <header className="relative z-20 border-b-2 border-zinc-800 bg-zinc-900 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={radius} className="fill-none stroke-zinc-800" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={isUrgent ? 'fill-none stroke-red-500 transition-all' : 'fill-none stroke-orange-500 transition-all'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase text-zinc-500">сек.</span>
            <span className={isUrgent ? 'text-2xl font-black text-red-500' : 'text-2xl font-black text-orange-500'}>{normalizedTimer}</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase text-zinc-500">Раунд</p>
          <p className="text-xl font-bold text-green-500">{String(Math.max(1, round)).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase text-zinc-400 mt-1">{state ? phaseLabelMap[state] : 'Ожидание'}</p>
        </div>
      </div>

      <div className="flex gap-6 items-center bg-black border border-zinc-700 px-6 py-3 rounded-md min-w-[300px]">
        <div className="text-center">
          <p className="text-[10px] uppercase text-zinc-500">Длительность игры</p>
          <p className="text-sm font-bold text-orange-400">{formatDuration(gameDurationSeconds)}</p>
        </div>
        <div className="h-10 w-[1px] bg-zinc-700" />
        <div className="text-center">
          <p className="text-[10px] uppercase text-zinc-500">Выжившие</p>
          <p className="text-sm font-bold text-emerald-400">{alivePlayersCount} / {Math.max(totalPlayersCount, 1)}</p>
        </div>
        <div className="h-10 w-[1px] bg-zinc-700" />
        <div className="text-center">
          <p className="text-[10px] uppercase text-zinc-500">Апокалипсис</p>
          <p className="text-sm font-bold text-red-500">{apocalypseName || 'Не выбран'}</p>
        </div>
        <div className="h-10 w-[1px] bg-zinc-700" />
        <div className="text-center">
          <p className="text-[10px] uppercase text-zinc-500">Локация</p>
          <p className="text-sm font-bold text-blue-400">{locationName || 'Не выбрана'}</p>
        </div>
      </div>
    </header>
  );
}
