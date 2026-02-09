import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Apocalypse } from '../entities/Apocalypse';
import { Location } from '../entities/Location';
import { Card } from '../entities/Card';
import { Room } from '../entities/Room';
import { Player } from '../entities/Player';
import { Session } from '../entities/Session';
import { PlayerCard } from '../entities/PlayerCard';
import { Vote } from '../entities/Vote';
import { ChatMessage } from '../entities/ChatMessage';
import { ApocalypseVote } from '../entities/ApocalypseVote';
import { LocationVote } from '../entities/LocationVote';

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
