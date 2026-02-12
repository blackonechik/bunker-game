import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { initializeDatabase } from '../db/data-source';
import { RoomService } from '@/src/features/room-management/api/room-service';
import { GameService } from '@/features/game-flow';
import { auth } from '@/auth';
import {
  RoomCreatePayload,
  RoomJoinPayload,
  VoteApocalypsePayload,
  VoteLocationPayload,
  VotePlayerPayload,
  CardRevealPayload,
  RoomState,
} from '@/shared/types';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export class SocketServer {
  private io: SocketIOServer;
  private playerSockets: Map<number, string> = new Map();
  private socketPlayers: Map<string, number> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupAuthMiddleware();
    this.setupHandlers();
  }

  private getHeadersFromSocket(socket: Socket) {
    const headers = new Headers();

    for (const [key, value] of Object.entries(socket.handshake.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    }

    return headers;
  }

  private setupAuthMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const headers = this.getHeadersFromSocket(socket);
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
          next(new Error('UNAUTHORIZED'));
          return;
        }

        socket.data.userId = session.user.id;
        socket.data.userName = session.user.name || 'Игрок';
        next();
      } catch {
        next(new Error('UNAUTHORIZED'));
      }
    });
  }

  private async getConnectedPlayer(socket: Socket) {
    const playerId = this.socketPlayers.get(socket.id);
    if (!playerId) {
      throw new Error('Игрок не подключен к комнате');
    }

    const player = await RoomService.getPlayerById(playerId);
    if (!player) {
      throw new Error('Игрок не найден');
    }

    return player;
  }

  private async bindSocketToPlayer(playerId: number, socketId: string) {
    const detachedPlayerIds: number[] = [];

    for (const [existingPlayerId, existingSocketId] of this.playerSockets.entries()) {
      if (existingSocketId === socketId && existingPlayerId !== playerId) {
        detachedPlayerIds.push(existingPlayerId);
        this.playerSockets.delete(existingPlayerId);
      }
    }

    for (const detachedPlayerId of detachedPlayerIds) {
      const detachedPlayer = await RoomService.setPlayerOnline(detachedPlayerId, false);
      if (detachedPlayer?.room) {
        const detachedPlayers = await RoomService.getPlayers(detachedPlayer.room.id);
        this.io.to(`room:${detachedPlayer.room.code}`).emit('player:offline', { playerId: detachedPlayerId });
        this.io.to(`room:${detachedPlayer.room.code}`).emit('room:update', {
          room: detachedPlayer.room,
          players: detachedPlayers,
        });
      }
    }

    this.playerSockets.set(playerId, socketId);
    this.socketPlayers.set(socketId, playerId);
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('room:create', async (data: RoomCreatePayload, callback) => {
        try {
          const userId = socket.data.userId as string;

          const { room, player } = await RoomService.createRoom(
            data.maxPlayers,
            data.hardcore,
            data.playerName,
            userId
          );

          socket.join(`room:${room.code}`);

          await this.bindSocketToPlayer(player.id, socket.id);
          await RoomService.setPlayerOnline(player.id, true);

          callback({
            success: true,
            data: {
              code: room.code,
              roomId: room.id,
              playerId: player.id,
              shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/join/${room.code}`,
            },
          });

          this.io.to(`room:${room.code}`).emit('room:update', {
            room,
            players: [player],
          });
          this.io.to(`room:${room.code}`).emit('player:online', { playerId: player.id });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка создания комнаты';
          callback({ success: false, error: message });
        }
      });

      socket.on('room:join', async (data: RoomJoinPayload, callback) => {
        try {
          const userId = socket.data.userId as string;

          const { room, player } = await RoomService.joinRoom(
            data.code,
            data.playerName,
            userId
          );

          socket.join(`room:${room.code}`);

          await this.bindSocketToPlayer(player.id, socket.id);
          await RoomService.setPlayerOnline(player.id, true);

          callback({
            success: true,
            data: {
              roomId: room.id,
              playerId: player.id,
              room,
            },
          });

          const players = await RoomService.getPlayers(room.id);

          this.io.to(`room:${room.code}`).emit('player:joined', { player });
          this.io.to(`room:${room.code}`).emit('player:online', { playerId: player.id });
          this.io.to(`room:${room.code}`).emit('room:update', { room, players });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка присоединения';
          callback({ success: false, error: message });
        }
      });

      socket.on('player:resume', async (data: { code: string }, callback) => {
        try {
          const userId = socket.data.userId as string;
          const roomCode = data.code.toUpperCase();

          const player = await RoomService.getPlayerByUserAndRoomCode(userId, roomCode);
          if (!player?.room) {
            throw new Error('Игрок не найден в этой комнате');
          }

          socket.join(`room:${player.room.code}`);
          await this.bindSocketToPlayer(player.id, socket.id);
          await RoomService.setPlayerOnline(player.id, true);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) {
            throw new Error('Комната не найдена');
          }

          const players = await RoomService.getPlayers(room.id);

          this.io.to(`room:${room.code}`).emit('player:online', { playerId: player.id });
          this.io.to(`room:${room.code}`).emit('room:update', { room, players });

          callback({ success: true, data: { room, players, playerId: player.id } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка восстановления подключения';
          callback({ success: false, error: message });
        }
      });

      socket.on('game:start', async (_data: unknown, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.hostPlayerId !== player.id) {
            throw new Error('Только хост может начать игру');
          }

          const players = await RoomService.getPlayers(room.id);
          if (players.length < 4) {
            throw new Error('Минимум 4 игрока для начала');
          }

          await GameService.startGame(room.id);

          const apocalypses = await GameService.getRandomApocalypses(3);

          callback({ success: true });

          this.io.to(`room:${room.code}`).emit('game:started', {
            state: RoomState.APOCALYPSE_VOTE,
          });
          this.io.to(`room:${room.code}`).emit('apocalypse:options', { apocalypses });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка старта игры';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:apocalypse', async (data: VoteApocalypsePayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          await GameService.voteApocalypse(player.roomId, player.id, data.apocalypseId);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countApocalypseVotes(room.id);

          callback({ success: true });

          if (votes.reduce((sum, v) => sum + parseInt(v.count), 0) === players.length) {
            const winnerId = parseInt(votes[0].apocalypseId);

            this.io.to(`room:${room.code}`).emit('voting:apocalypse:complete', {
              winnerId,
              votes,
            });

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

      socket.on('vote:location', async (data: VoteLocationPayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          await GameService.voteLocation(player.roomId, player.id, data.locationId);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countLocationVotes(room.id);

          callback({ success: true });

          if (votes.reduce((sum, v) => sum + parseInt(v.count), 0) === players.length) {
            const winnerId = parseInt(votes[0].locationId);

            this.io.to(`room:${room.code}`).emit('voting:location:complete', {
              winnerId,
              votes,
            });

            setTimeout(async () => {
              await RoomService.updateRoomState(room.id, RoomState.DEALING);
              await GameService.dealCards(room.id);

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

      socket.on('card:reveal', async (data: CardRevealPayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          await GameService.revealCard(data.cardId, room.currentRound);

          callback({ success: true });

          this.io.to(`room:${room.code}`).emit('card:revealed', {
            playerId: player.id,
            cardId: data.cardId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка раскрытия карты';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:player', async (data: VotePlayerPayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          await GameService.votePlayer(room.id, player.id, data.targetPlayerId, room.currentRound);

          callback({ success: true });

          const players = await RoomService.getPlayers(room.id);
          const alivePlayers = players.filter(p => p.isAlive);
          const votes = await GameService.countPlayerVotes(room.id, room.currentRound);

          if (votes.reduce((sum, v) => sum + parseInt(v.count), 0) === alivePlayers.length) {
            const eliminatedId = parseInt(votes[0].targetId);
            await GameService.eliminatePlayer(eliminatedId);

            this.io.to(`room:${room.code}`).emit('player:eliminated', {
              playerId: eliminatedId,
              votes,
            });

            const remainingPlayers = players.filter(p => p.isAlive && p.id !== eliminatedId);
            const location = room.location;

            if (location && remainingPlayers.length <= location.capacity) {
              await RoomService.updateRoomState(room.id, RoomState.FINISHED);

              this.io.to(`room:${room.code}`).emit('game:ended', {
                winners: remainingPlayers,
              });
            } else {
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

      socket.on('player:kick', async (data: { targetPlayerId: number }, callback) => {
        try {
          const host = await this.getConnectedPlayer(socket);

          const player = await RoomService.getPlayerById(data.targetPlayerId);
          if (!player) {
            throw new Error('Игрок не найден');
          }

          const room = await RoomService.getRoomByCode(player.room.code);
          if (!room) {
            throw new Error('Комната не найдена');
          }

          const targetSocketId = this.playerSockets.get(data.targetPlayerId);

          await RoomService.removePlayer(data.targetPlayerId, host.id);

          const players = await RoomService.getPlayers(room.id);

          if (targetSocketId) {
            this.io.to(targetSocketId).emit('player:kicked', { message: 'Вы были удалены из комнаты' });
          }

          this.io.to(`room:${room.code}`).emit('player:removed', { playerId: data.targetPlayerId });
          this.io.to(`room:${room.code}`).emit('room:update', { room, players });

          this.playerSockets.delete(data.targetPlayerId);
          if (targetSocketId) {
            this.socketPlayers.delete(targetSocketId);
          }

          callback({ success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка удаления игрока';
          callback({ success: false, error: message });
        }
      });

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);

        const disconnectedPlayerId = this.socketPlayers.get(socket.id) ?? null;

        if (disconnectedPlayerId) {
          try {
            const player = await RoomService.setPlayerOnline(disconnectedPlayerId, false);

            if (player && player.room) {
              const players = await RoomService.getPlayers(player.room.id);

              this.io.to(`room:${player.room.code}`).emit('player:offline', { playerId: disconnectedPlayerId });
              this.io.to(`room:${player.room.code}`).emit('room:update', { room: player.room, players });
            }

            this.playerSockets.delete(disconnectedPlayerId);
            this.socketPlayers.delete(socket.id);
          } catch (error) {
            console.error('Error handling disconnect:', error);
          }
        }
      });
    });
  }

  public getIO() {
    return this.io;
  }
}

export async function initializeSocketServer(req: NextApiRequest, res: NextApiResponseWithSocket) {
  await initializeDatabase();

  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
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
