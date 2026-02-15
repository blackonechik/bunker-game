import { ChatMessageDTO, PlayerCardDTO, PlayerDTO, RoomState } from '@/shared/types';

export interface VoteOptionItem {
  id: number;
  name: string;
  description: string;
  image: string;
}

export interface VoteSelectionScreenProps {
  title: string;
  options: VoteOptionItem[];
  onSelect: (id: number) => void;
  mode: 'apocalypse' | 'location';
}

export interface GameTopBarProps {
  round: number;
  state?: RoomState;
  timer: number;
  apocalypseName?: string;
  locationName?: string;
  gameDurationSeconds: number;
  alivePlayersCount: number;
  totalPlayersCount: number;
}

export interface MyCardsHudProps {
  playerName: string;
  cards: PlayerCardDTO[];
  canReveal: boolean;
  hasRevealedThisRound: boolean;
  onReveal: (cardId: number) => void;
}

export interface PlayerCardsListProps {
  cards: PlayerCardDTO[];
  hiddenSlots?: number;
  containerClassName?: string;
}

export interface PlayersGridProps {
  players: PlayerDTO[];
  currentPlayerId?: number;
  canVote: boolean;
  onVote: (targetPlayerId: number) => void;
}

export interface SystemLogPanelProps {
  messages: ChatMessageDTO[];
  onSendMessage: (message: string) => void;
}

export interface VictoryScreenProps {
  winners: PlayerDTO[];
}
