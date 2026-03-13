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
import { getDatabaseConnectionOptions } from '@/src/shared/api/db/connection-options';

const databaseConnection = getDatabaseConnectionOptions();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: databaseConnection.host,
  port: databaseConnection.port,
  username: databaseConnection.user,
  password: databaseConnection.password,
  database: databaseConnection.database,
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
