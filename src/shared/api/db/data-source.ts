import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Apocalypse } from '@/lib/entities/Apocalypse';
import { Location } from '@/lib/entities/Location';
import { Card } from '@/lib/entities/Card';
import { Room } from '@/lib/entities/Room';
import { Player } from '@/lib/entities/Player';
import { PlayerCard } from '@/lib/entities/PlayerCard';
import { Session } from '@/lib/entities/Session';
import { Vote } from '@/lib/entities/Vote';
import { ApocalypseVote } from '@/lib/entities/ApocalypseVote';
import { LocationVote } from '@/lib/entities/LocationVote';
import { ChatMessage } from '@/lib/entities/ChatMessage';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'bunker',
  password: process.env.DB_PASSWORD || 'StrongPass123!',
  database: process.env.DB_DATABASE || 'bunker_game',
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
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

export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
  return AppDataSource;
}

export function getDataSource() {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
}
