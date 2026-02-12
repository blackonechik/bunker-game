// Перечисления
export enum RoomState {
  WAITING = 'WAITING',
  APOCALYPSE_VOTE = 'APOCALYPSE_VOTE',
  LOCATION_VOTE = 'LOCATION_VOTE',
  DEALING = 'DEALING',
  ROUND_START = 'ROUND_START',
  CARD_REVEAL = 'CARD_REVEAL',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  ELIMINATION = 'ELIMINATION',
  FINISHED = 'FINISHED'
}

export enum CardType {
  PROFESSION = 'profession',
  AGE = 'age',
  HEALTH = 'health',
  PHOBIA = 'phobia',
  INVENTORY = 'inventory',
  TRAIT = 'trait',
  HOBBY = 'hobby',
  SPECIAL = 'special'
}

export enum VoteType {
  APOCALYPSE = 'apocalypse',
  LOCATION = 'location',
  PLAYER = 'player'
}

// Интерфейсы для Socket.io событий
export interface RoomCreatePayload {
  maxPlayers: number;
  hardcore: boolean;
  playerName: string;
}

export interface RoomJoinPayload {
  code: string;
  playerName: string;
}

export interface VoteApocalypsePayload {
  apocalypseId: number;
}

export interface VoteLocationPayload {
  locationId: number;
}

export interface VotePlayerPayload {
  targetPlayerId: number;
}

export interface CardRevealPayload {
  cardId: number;
}

export interface ChatMessagePayload {
  message: string;
}

// Интерфейсы для данных
export interface PlayerDTO {
  id: number;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  isOnline: boolean;
  cards?: PlayerCardDTO[];
}

export interface PlayerCardDTO {
  id: number;
  cardId: number;
  isRevealed: boolean;
  card: CardDTO;
}

export interface CardDTO {
  id: number;
  type: CardType;
  value: string;
  description?: string;
  rarity?: string;
}

export interface RoomDTO {
  id: number;
  code: string;
  state: RoomState;
  maxPlayers: number;
  currentRound: number;
  players: PlayerDTO[];
  apocalypse?: ApocalypseDTO;
  location?: LocationDTO;
}

export interface ApocalypseDTO {
  id: number;
  name: string;
  description: string;
  hazardLevel: string;
  duration: string;
}

export interface LocationDTO {
  id: number;
  name: string;
  capacity: number;
  supplies: string[];
  condition: string;
  description: string;
}

export interface ChatMessageDTO {
  id: number;
  playerName?: string;
  message: string;
  type: 'user' | 'system';
  createdAt: Date;
}

export interface VoteResultDTO {
  playerId: number;
  playerName: string;
  voteCount: number;
}

export interface GameStatsDTO {
  totalRounds: number;
  survivorCount: number;
  eliminatedCount: number;
}
