export const VOTE_OPTION_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523575708161-ad0fc2a9b951?auto=format&fit=crop&q=80&w=1200';

export const VOTE_APPEARANCE = {
  apocalypse: {
    hoverBorder: 'hover:border-orange-600/50',
    activeTextColor: 'text-orange-500',
    hoverText: 'group-hover:text-orange-500',
    corner: 'border-orange-600',
  },
  location: {
    hoverBorder: 'hover:border-green-600/50',
    activeTextColor: 'text-green-500',
    hoverText: 'group-hover:text-green-500',
    corner: 'border-green-600',
  },
} as const;
