import { CardType } from '@/shared/types';

interface CardAccentClasses {
  hudBorder: string;
  hudValue: string;
  hudBar: string;
  listItem: string;
}

const DEFAULT_ACCENT: CardAccentClasses = {
  hudBorder: 'hover:border-zinc-500/50',
  hudValue: 'group-hover:text-zinc-200',
  hudBar: 'bg-zinc-500',
  listItem: 'bg-zinc-800 border-zinc-700 text-zinc-300',
};

const CARD_ACCENT_MAP: Record<CardType, CardAccentClasses> = {
  [CardType.PROFESSION]: {
    hudBorder: 'hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    hudValue: 'group-hover:text-green-400',
    hudBar: 'bg-green-500',
    listItem: 'bg-emerald-950 border-emerald-900 text-emerald-400',
  },
  [CardType.HEALTH]: {
    hudBorder: 'hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    hudValue: 'group-hover:text-red-400',
    hudBar: 'bg-red-500',
    listItem: 'bg-red-950 border-red-900 text-red-400',
  },
  [CardType.PHOBIA]: {
    hudBorder: 'hover:border-zinc-500/50',
    hudValue: 'group-hover:text-zinc-100',
    hudBar: 'bg-zinc-500',
    listItem: 'bg-purple-950 border-purple-900 text-purple-400',
  },
  [CardType.INVENTORY]: {
    hudBorder: 'hover:border-yellow-500/50',
    hudValue: 'group-hover:text-yellow-500',
    hudBar: 'bg-yellow-500',
    listItem: 'bg-blue-950 border-blue-900 text-blue-400',
  },
  [CardType.TRAIT]: {
    hudBorder: 'hover:border-blue-500/50',
    hudValue: 'group-hover:text-blue-400',
    hudBar: 'bg-blue-500',
    listItem: 'bg-yellow-950 border-yellow-900 text-yellow-400',
  },
  [CardType.HOBBY]: {
    hudBorder: 'hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]',
    hudValue: 'group-hover:text-orange-400',
    hudBar: 'bg-orange-500',
    listItem: 'bg-cyan-950 border-cyan-900 text-cyan-400',
  },
  [CardType.AGE]: {
    hudBorder: 'hover:border-purple-500/50',
    hudValue: 'group-hover:text-purple-400',
    hudBar: 'bg-purple-500',
    listItem: 'bg-orange-950 border-orange-900 text-orange-400',
  },
  [CardType.SPECIAL]: {
    hudBorder: 'border-4 border-double border-green-500 hover:bg-green-500/5',
    hudValue: 'text-green-400 uppercase underline decoration-double',
    hudBar: 'bg-green-500',
    listItem: 'bg-pink-950 border-pink-900 text-pink-400',
  },
};

export function getAccentClasses(type: CardType): CardAccentClasses {
  return CARD_ACCENT_MAP[type] || DEFAULT_ACCENT;
}
