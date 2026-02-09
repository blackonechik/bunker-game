import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Apocalypse } from '@/entities/apocalypse';
import { Location } from '@/entities/location';
import { Card } from '@/entities/card';
import { Room } from '@/entities/room';
import { Player, PlayerCard } from '@/entities/player';
import { Session } from '@/entities/session';
import { Vote, ApocalypseVote, LocationVote } from '@/entities/vote';
import { ChatMessage } from '@/entities/chat-message';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'bunker',
  password: process.env.DB_PASSWORD || 'StrongPass123!',
  database: process.env.DB_DATABASE || 'bunker_game',
  synchronize: process.env.NODE_ENV === 'development', // только для разработки
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Apocalypse,
    Location,
    Card,
    Room,
    Player,
    Session,
    PlayerCard,
    Vote,
    ChatMessage,
    ApocalypseVote,
    LocationVote
  ],
  migrations: [],
  subscribers: [],
});

let isInitialized = false;

export async function initializeDatabase() {
  if (!isInitialized) {
    try {
      await AppDataSource.initialize();
      isInitialized = true;
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
  return AppDataSource;
}

export function getDataSource() {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
}
