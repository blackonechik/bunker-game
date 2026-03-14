import { ChatMessageDTO, PlayerCardDTO, PlayerDTO, PlayerVoteProgressDTO, RoomState } from '@/shared/types';

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
  selectedOptionId?: number | null;
  isSubmitting?: boolean;
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
  selectedTargetPlayerId?: number | null;
  isSubmittingVote?: boolean;
  liveVotes?: PlayerVoteProgressDTO[];
}

export interface SystemLogPanelProps {
  messages: ChatMessageDTO[];
  onSendMessage: (message: string) => void;
}

export interface VictoryScreenProps {
  winners: PlayerDTO[];
}
