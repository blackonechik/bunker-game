import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { initializeDatabase } from '@/shared/api/db/data-source';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';
import { verifyToken } from '../utils/jwt';
import {
  RoomCreatePayload,
  RoomJoinPayload,
  VoteApocalypsePayload,
  VoteLocationPayload,
  VotePlayerPayload,
  CardRevealPayload,
  RoomState,
} from '../types';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export class SocketServer {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // СОЗДАНИЕ КОМНАТЫ
      socket.on('room:create', async (data: RoomCreatePayload, callback) => {
        try {
          const { room, player, token } = await RoomService.createRoom(
            data.maxPlayers,
            data.hardcore,
            data.playerName
          );

          // Присоединяем к комнате
          socket.join(`room:${room.code}`);

          callback({
            success: true,
            data: {
              code: room.code,
              roomId: room.id,
              playerId: player.id,
              token,
              shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/join/${room.code}`,
            },
          });

          // Отправляем обновление в комнату
          this.io.to(`room:${room.code}`).emit('room:update', {
            room,
            players: [player],
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка создания комнаты';
          callback({ success: false, error: message });
        }
      });

      // ПРИСОЕДИНЕНИЕ К КОМНАТЕ
      socket.on('room:join', async (data: RoomJoinPayload, callback) => {
        try {
          const { room, player, token } = await RoomService.joinRoom(
            data.code,
            data.playerName
          );

          // Присоединяем к комнате
          socket.join(`room:${room.code}`);

          callback({
            success: true,
            data: {
              roomId: room.id,
              playerId: player.id,
              token,
              room,
            },
          });

          // Получаем всех игроков
          const players = await RoomService.getPlayers(room.id);

          // Уведомляем всех в комнате
          this.io.to(`room:${room.code}`).emit('player:joined', { player });
          this.io.to(`room:${room.code}`).emit('room:update', { room, players });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка присоединения';
          callback({ success: false, error: message });
        }
      });

      // СТАРТ ИГРЫ
      socket.on('game:start', async (data: { token: string }, callback) => {
        try {
          const payload = verifyToken(data.token);
          if (!payload) throw new Error('Неверный токен');

          const room = await RoomService.getRoom(payload.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.hostPlayerId !== payload.playerId) {
            throw new Error('Только хост может начать игру');
          }

          const players = await RoomService.getPlayers(room.id);
          if (players.length < 4) {
            throw new Error('Минимум 4 игрока для начала');
          }

          // Начинаем игру
          await GameService.startGame(room.id);

          // Получаем варианты апокалипсисов
          const apocalypses = await GameService.getRandomApocalypses(3);

          callback({ success: true });

          // Уведомляем всех
          this.io.to(`room:${room.code}`).emit('game:started', {
            state: RoomState.APOCALYPSE_VOTE,
          });
          this.io.to(`room:${room.code}`).emit('apocalypse:options', { apocalypses });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка старта игры';
          callback({ success: false, error: message });
        }
      });

      // ГОЛОСОВАНИЕ ЗА АПОКАЛИПСИС
      socket.on('vote:apocalypse', async (data: VoteApocalypsePayload & { token: string }, callback) => {
        try {
          const payload = verifyToken(data.token);
          if (!payload) throw new Error('Неверный токен');

          await GameService.voteApocalypse(payload.roomId, payload.playerId, data.apocalypseId);

          const room = await RoomService.getRoom(payload.roomId);
          if (!room) throw new Error('Комната не найдена');

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countApocalypseVotes(room.id);

          callback({ success: true });

          // Проверяем, все ли проголосовали
          if (votes.reduce((sum: number, v: { count: string }) => sum + parseInt(v.count), 0) === players.length) {
            // Все проголосовали, определяем победителя
            const winnerId = parseInt(votes[0].apocalypseId);
            
            this.io.to(`room:${room.code}`).emit('voting:apocalypse:complete', {
              winnerId,
              votes,
            });

            // Переходим к голосованию за локацию
            setTimeout(async () => {
              await RoomService.updateRoomState(room.id, RoomState.LOCATION_VOTE);
              const locations = await GameService.getRandomLocations(3);
              
              this.io.to(`room:${room.code}`).emit('location:options', { locations });
            }, 3000);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка голосования';
          callback({ success: false, error: message });
        }
      });

      // ГОЛОСОВАНИЕ ЗА ЛОКАЦИЮ
      socket.on('vote:location', async (data: VoteLocationPayload & { token: string }, callback) => {
        try {
          const payload = verifyToken(data.token);
          if (!payload) throw new Error('Неверный токен');

          await GameService.voteLocation(payload.roomId, payload.playerId, data.locationId);

          const room = await RoomService.getRoom(payload.roomId);
          if (!room) throw new Error('Комната не найдена');

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countLocationVotes(room.id);

          callback({ success: true });

          // Проверяем, все ли проголосовали
          if (votes.reduce((sum: number, v: { count: string }) => sum + parseInt(v.count), 0) === players.length) {
            const winnerId = parseInt(votes[0].locationId);
            
            this.io.to(`room:${room.code}`).emit('voting:location:complete', {
              winnerId,
              votes,
            });

            // Раздаем карты
            setTimeout(async () => {
              await RoomService.updateRoomState(room.id, RoomState.DEALING);
              await GameService.dealCards(room.id);
              
              // Начинаем первый раунд
              await RoomService.updateRoomState(room.id, RoomState.DISCUSSION);
              
              this.io.to(`room:${room.code}`).emit('game:round_start', {
                round: 1,
                state: RoomState.DISCUSSION,
              });
            }, 3000);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка голосования';
          callback({ success: false, error: message });
        }
      });

      // РАСКРЫТИЕ КАРТЫ
      socket.on('card:reveal', async (data: CardRevealPayload & { token: string }, callback) => {
        try {
          const payload = verifyToken(data.token);
          if (!payload) throw new Error('Неверный токен');

          const room = await RoomService.getRoom(payload.roomId);
          if (!room) throw new Error('Комната не найдена');

          await GameService.revealCard(data.cardId, room.currentRound);

          callback({ success: true });

          // Уведомляем всех
          this.io.to(`room:${room.code}`).emit('card:revealed', {
            playerId: payload.playerId,
            cardId: data.cardId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка раскрытия карты';
          callback({ success: false, error: message });
        }
      });

      // ГОЛОСОВАНИЕ ЗА ИГРОКА
      socket.on('vote:player', async (data: VotePlayerPayload & { token: string }, callback) => {
        try {
          const payload = verifyToken(data.token);
          if (!payload) throw new Error('Неверный токен');

          const currentPlayer = await RoomService.getPlayerById(payload.playerId);
          if (!currentPlayer || !currentPlayer.isAlive) {
            throw new Error('Выбывшие игроки не могут голосовать');
          }

          const room = await RoomService.getRoom(payload.roomId);
          if (!room) throw new Error('Комната не найдена');

          const players = await RoomService.getPlayers(room.id);
          const target = players.find((player) => player.id === data.targetPlayerId);

          if (!target || !target.isAlive) {
            throw new Error('Нельзя голосовать за выбывшего игрока');
          }

          await GameService.votePlayer(room.id, payload.playerId, data.targetPlayerId, room.currentRound);

          callback({ success: true });

          const alivePlayers = players.filter((p: { isAlive: boolean }) => p.isAlive);
          const votes = await GameService.countPlayerVotes(room.id, room.currentRound);

          // Проверяем, все ли проголосовали
          if (votes.reduce((sum: number, v: { count: string }) => sum + parseInt(v.count), 0) === alivePlayers.length) {
            // Определяем исключенного
            const eliminatedId = parseInt(votes[0].targetId);
            await GameService.eliminatePlayer(eliminatedId);

            this.io.to(`room:${room.code}`).emit('player:eliminated', {
              playerId: eliminatedId,
              votes,
            });

            // Проверяем условие окончания игры
            const remainingPlayers = players.filter((p: { isAlive: boolean; id: number }) => p.isAlive && p.id !== eliminatedId);
            if (remainingPlayers.length <= 2) {
              // Игра окончена
              await RoomService.updateRoomState(room.id, RoomState.FINISHED);
              
              this.io.to(`room:${room.code}`).emit('game:ended', {
                winners: remainingPlayers,
              });
            } else {
              // Следующий раунд
              setTimeout(async () => {
                const newRound = room.currentRound + 1;
                await RoomService.updateRoomState(room.id, RoomState.DISCUSSION);
                
                this.io.to(`room:${room.code}`).emit('game:round_start', {
                  round: newRound,
                  state: RoomState.DISCUSSION,
                });
              }, 5000);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка голосования';
          callback({ success: false, error: message });
        }
      });

      // ОТКЛЮЧЕНИЕ
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public getIO() {
    return this.io;
  }
}

const FALLBACK_APP_URL = 'https://bunker.blackone.pro';

function getAllowedOrigins() {
  const origins = Array.from(
    new Set(
      [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.BETTER_AUTH_URL,
        ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []),
      ]
        .map((origin) => origin?.trim())
        .filter((origin): origin is string => Boolean(origin))
    )
  );

  return origins.length > 0 ? origins : [FALLBACK_APP_URL];
}

export async function initializeSocketServer(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // Инициализируем БД
  await initializeDatabase();

  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const allowedOrigins = getAllowedOrigins();

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;
    new SocketServer(io);

    console.log('✅ Socket.IO server initialized');
  } else {
    console.log('Socket.IO server already running');
  }

  return res.socket.server.io;
}
