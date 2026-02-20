import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { initializeDatabase } from '../db/data-source';
import { Player } from '@/lib/entities/Player';
import { RoomService } from '@/src/features/room-management/api/room-service';
import { GameService } from '@/features/game-flow';
import { auth } from '@/auth';
import {
  ApocalypseDTO,
  RoomCreatePayload,
  RoomJoinPayload,
  LocationDTO,
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
  private roomApocalypseOptions: Map<number, ApocalypseDTO[]> = new Map();
  private roomLocationOptions: Map<number, LocationDTO[]> = new Map();
  private roomDiscussionTimers: Map<number, NodeJS.Timeout> = new Map();
  private roomCardRevealTimers: Map<number, NodeJS.Timeout> = new Map();
  private finalizingApocalypseRooms: Set<number> = new Set();
  private finalizingLocationRooms: Set<number> = new Set();
  private finalizingPlayerVoteRounds: Set<string> = new Set();

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

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private async runBotApocalypseVotes(roomId: number, apocalypseIds: number[]) {
    if (apocalypseIds.length === 0) return;

    const players = await RoomService.getPlayers(roomId);
    const botPlayers = players.filter((player) => player.isBot);
    const existingVotes = await GameService.getApocalypseVotes(roomId);
    const votedBotIds = new Set(existingVotes.map((vote) => vote.playerId));

    for (const bot of botPlayers) {
      if (votedBotIds.has(bot.id)) {
        continue;
      }

      const apocalypseId = this.getRandomItem(apocalypseIds);
      await GameService.voteApocalypse(roomId, bot.id, apocalypseId);
    }
  }

  private async runBotLocationVotes(roomId: number, locationIds: number[]) {
    if (locationIds.length === 0) return;

    const players = await RoomService.getPlayers(roomId);
    const botPlayers = players.filter((player) => player.isBot);

    for (const bot of botPlayers) {
      const locationId = this.getRandomItem(locationIds);
      await GameService.voteLocation(roomId, bot.id, locationId);
    }
  }

  private async runBotPlayerVotes(roomId: number, round: number, alivePlayers: Player[]) {
    const botPlayers = alivePlayers.filter((player) => player.isBot);

    for (const bot of botPlayers) {
      const targets = alivePlayers.filter((player) => player.id !== bot.id);
      if (targets.length === 0) continue;

      const target = this.getRandomItem(targets);
      await GameService.votePlayer(roomId, bot.id, target.id, round);
    }
  }

  private async runBotCardReveals(roomId: number, round: number, roomCode: string) {
    const players = await RoomService.getPlayers(roomId);
    const botPlayers = players.filter((player) => player.isBot && player.isAlive);

    for (const bot of botPlayers) {
      const hiddenCards = (bot.cards || []).filter((card) => !card.isRevealed);
      if (hiddenCards.length === 0) {
        continue;
      }

      const cardToReveal = this.getRandomItem(hiddenCards);
      await GameService.revealCard(cardToReveal.id, round);

      this.io.to(`room:${roomCode}`).emit('card:revealed', {
        playerId: bot.id,
        cardId: cardToReveal.id,
      });
    }
  }

  private async processPlayerVotingOutcome(roomId: number, roomCode: string, round: number) {
    const finalizeKey = `${roomId}:${round}`;
    if (this.finalizingPlayerVoteRounds.has(finalizeKey)) {
      return;
    }

    const room = await RoomService.getRoom(roomId);
    if (!room || room.state !== RoomState.VOTING || room.currentRound !== round) {
      return;
    }

    const players = await RoomService.getPlayers(room.id);
    const alivePlayers = players.filter((player) => player.isAlive);
    const votes = await GameService.countPlayerVotes(room.id, round);

    if (votes.reduce((sum, vote) => sum + parseInt(vote.count), 0) < alivePlayers.length) {
      return;
    }

    this.finalizingPlayerVoteRounds.add(finalizeKey);

    try {
      const freshRoom = await RoomService.getRoom(room.id);
      if (!freshRoom || freshRoom.state !== RoomState.VOTING || freshRoom.currentRound !== round) {
        return;
      }

      const latestVotes = await GameService.countPlayerVotes(room.id, round);
      if (latestVotes.length === 0) {
        return;
      }

      const eliminatedId = parseInt(latestVotes[0].targetId);
      await GameService.eliminatePlayer(eliminatedId);
      await GameService.revealAllPlayerCards(eliminatedId, round);
      await this.emitRoomUpdate(room.id, room.code);

      this.io.to(`room:${room.code}`).emit('player:eliminated', {
        playerId: eliminatedId,
        votes: latestVotes,
      });

      const updatedPlayers = await RoomService.getPlayers(room.id);
      const remainingPlayers = updatedPlayers.filter((player) => player.isAlive);

      if (remainingPlayers.length <= 2) {
        this.clearDiscussionTimer(room.id);
        this.clearCardRevealTimer(room.id);
        await RoomService.updateRoundTimer(room.id, null);
        await RoomService.updateRoomState(room.id, RoomState.FINISHED);
        await this.emitRoomUpdate(room.id, room.code);

        this.io.to(`room:${room.code}`).emit('game:ended', {
          winners: remainingPlayers,
        });

        setTimeout(() => {
          this.cleanupFinishedRoom(room.id, room.code).catch((error) => {
            console.error('Error cleaning finished room:', error);
          });
        }, 15000);
      } else {
        setTimeout(async () => {
          await this.startDiscussionRound(room.id, room.code);
        }, 5000);
      }
    } finally {
      this.finalizingPlayerVoteRounds.delete(finalizeKey);
    }
  }

  private clearDiscussionTimer(roomId: number) {
    const timer = this.roomDiscussionTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomDiscussionTimers.delete(roomId);
    }
  }

  private clearCardRevealTimer(roomId: number) {
    const timer = this.roomCardRevealTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomCardRevealTimers.delete(roomId);
    }
  }

  private async cleanupFinishedRoom(roomId: number, roomCode: string) {
    this.clearDiscussionTimer(roomId);
    this.clearCardRevealTimer(roomId);
    this.roomApocalypseOptions.delete(roomId);
    this.roomLocationOptions.delete(roomId);

    const players = await RoomService.getPlayers(roomId);
    for (const player of players) {
      const socketId = this.playerSockets.get(player.id);
      if (socketId) {
        this.socketPlayers.delete(socketId);
      }
      this.playerSockets.delete(player.id);
    }

    await GameService.cleanupRoomData(roomId);
    this.io.in(`room:${roomCode}`).socketsLeave(`room:${roomCode}`);
  }

  private async emitRoomUpdate(roomId: number, roomCode: string) {
    const room = await RoomService.getRoom(roomId);
    if (!room) {
      return null;
    }

    const players = await RoomService.getPlayers(roomId);
    this.io.to(`room:${roomCode}`).emit('room:update', { room, players });
    return { room, players };
  }

  private async allAlivePlayersDoneReveal(roomId: number, round: number) {
    const players = await RoomService.getPlayers(roomId);
    const alivePlayers = players.filter((player) => player.isAlive);

    return alivePlayers.every((alivePlayer) => {
      const cards = alivePlayer.cards || [];
      const hasHiddenCards = cards.some((card) => !card.isRevealed);

      if (!hasHiddenCards) {
        return true;
      }

      return cards.some((card) => card.revealedRound === round);
    });
  }

  private async tryStartVotingPhase(roomId: number, roomCode: string, round: number) {
    const room = await RoomService.getRoom(roomId);
    if (!room || room.state !== RoomState.CARD_REVEAL) {
      return false;
    }

    const readyToVote = await this.allAlivePlayersDoneReveal(roomId, round);
    if (!readyToVote) {
      return false;
    }

    if (round < 2) {
      this.clearCardRevealTimer(roomId);
      await RoomService.updateRoundTimer(roomId, null);
      await RoomService.updateRoomState(roomId, RoomState.ROUND_START);
      await this.emitRoomUpdate(roomId, roomCode);

      setTimeout(async () => {
        const currentRoom = await RoomService.getRoom(roomId);
        if (!currentRoom || currentRoom.state !== RoomState.ROUND_START || currentRoom.currentRound !== round) {
          return;
        }

        await this.startDiscussionRound(roomId, roomCode);
      }, 1200);

      return true;
    }

    this.clearCardRevealTimer(roomId);
    await RoomService.updateRoomState(roomId, RoomState.VOTING);
    await RoomService.updateRoundTimer(roomId, null);
    await this.emitRoomUpdate(roomId, roomCode);

    this.io.to(`room:${roomCode}`).emit('game:phase_changed', {
      round,
      state: RoomState.VOTING,
    });

    setTimeout(async () => {
      const room = await RoomService.getRoom(roomId);
      if (!room || room.state !== RoomState.VOTING || room.currentRound !== round) {
        return;
      }

      const alivePlayers = (await RoomService.getPlayers(roomId)).filter((player) => player.isAlive);
      await this.runBotPlayerVotes(roomId, round, alivePlayers);
      await this.processPlayerVotingOutcome(roomId, roomCode, round);
    }, 800);

    return true;
  }

  private async moveToCardRevealPhase(roomId: number, roomCode: string, round: number) {
    await RoomService.updateRoundTimer(roomId, null);
    await RoomService.updateRoomState(roomId, RoomState.CARD_REVEAL);
    await this.emitRoomUpdate(roomId, roomCode);

    this.io.to(`room:${roomCode}`).emit('game:phase_changed', {
      round,
      state: RoomState.CARD_REVEAL,
    });

    setTimeout(async () => {
      const room = await RoomService.getRoom(roomId);
      if (!room || room.state !== RoomState.CARD_REVEAL || room.currentRound !== round) {
        return;
      }

      await this.runBotCardReveals(roomId, round, roomCode);
      await this.emitRoomUpdate(roomId, roomCode);
      await this.tryStartVotingPhase(roomId, roomCode, round);
    }, 1200);

    this.clearCardRevealTimer(roomId);

    await this.tryStartVotingPhase(roomId, roomCode, round);
  }

  private async startDiscussionRound(roomId: number, roomCode: string) {
    await GameService.startRound(roomId);
    const discussionEndsAt = Math.floor(Date.now() / 1000) + 60;
    await RoomService.updateRoundTimer(roomId, discussionEndsAt);

    const snapshot = await this.emitRoomUpdate(roomId, roomCode);
    if (!snapshot) {
      return;
    }

    const round = snapshot.room.currentRound;

    this.io.to(`room:${roomCode}`).emit('game:round_start', {
      round,
      state: RoomState.DISCUSSION,
      duration: 60,
      endsAt: discussionEndsAt,
    });

    this.clearDiscussionTimer(roomId);
    const timer = setTimeout(async () => {
      try {
        await this.moveToCardRevealPhase(roomId, roomCode, round);
      } catch (error) {
        console.error('Error moving to card reveal phase:', error);
      }
    }, 60000);
    this.roomDiscussionTimers.set(roomId, timer);
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

          if (room.state === RoomState.APOCALYPSE_VOTE) {
            let apocalypses = this.roomApocalypseOptions.get(room.id);
            if (!apocalypses || apocalypses.length === 0) {
              apocalypses = await GameService.getRandomApocalypses(3);
              this.roomApocalypseOptions.set(room.id, apocalypses);
            }

            if (apocalypses.length > 0) {
              socket.emit('apocalypse:options', { apocalypses });
            }
          }

          if (room.state === RoomState.LOCATION_VOTE) {
            let locations = this.roomLocationOptions.get(room.id);
            if (!locations || locations.length === 0) {
              locations = await GameService.getRandomLocations(3);
              this.roomLocationOptions.set(room.id, locations);
            }

            if (locations.length > 0) {
              socket.emit('location:options', { locations });
            }
          }

          if (room.state === RoomState.DISCUSSION && typeof room.roundTimer === 'number') {
            const currentSeconds = Math.floor(Date.now() / 1000);
            const remainingSeconds = Math.max(0, room.roundTimer - currentSeconds);
            socket.emit('game:timer_sync', {
              round: room.currentRound,
              state: RoomState.DISCUSSION,
              remainingSeconds,
              endsAt: room.roundTimer,
            });
          }

          callback({ success: true, data: { room, players, playerId: player.id } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка восстановления подключения';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:options:sync', async (data: { code?: string }, callback) => {
        try {
          const userId = socket.data.userId as string;

          let player = await this.getConnectedPlayer(socket).catch(() => null);

          if (!player) {
            const roomCode = data?.code?.trim()?.toUpperCase();
            if (!roomCode) {
              throw new Error('Не удалось определить комнату для синхронизации');
            }

            const restoredPlayer = await RoomService.getPlayerByUserAndRoomCode(userId, roomCode);
            if (!restoredPlayer?.room) {
              throw new Error('Игрок не найден в этой комнате');
            }

            socket.join(`room:${restoredPlayer.room.code}`);
            await this.bindSocketToPlayer(restoredPlayer.id, socket.id);
            await RoomService.setPlayerOnline(restoredPlayer.id, true);

            player = await RoomService.getPlayerById(restoredPlayer.id);
          }

          if (!player) {
            throw new Error('Игрок не найден');
          }

          const room = await RoomService.getRoom(player.roomId);

          if (!room) {
            throw new Error('Комната не найдена');
          }

          let apocalypses = this.roomApocalypseOptions.get(room.id) || [];
          let locations = this.roomLocationOptions.get(room.id) || [];

          if (room.state === RoomState.APOCALYPSE_VOTE && apocalypses.length === 0) {
            apocalypses = await GameService.getRandomApocalypses(3);
            this.roomApocalypseOptions.set(room.id, apocalypses);
          }

          if (room.state === RoomState.LOCATION_VOTE && locations.length === 0) {
            locations = await GameService.getRandomLocations(3);
            this.roomLocationOptions.set(room.id, locations);
          }

          callback({
            success: true,
            data: {
              state: room.state,
              apocalypses,
              locations,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка синхронизации вариантов голосования';
          callback({ success: false, error: message });
        }
      });

      socket.on('game:start', async (_data: unknown, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.state !== RoomState.WAITING) {
            throw new Error('Игра уже запущена');
          }

          if (room.hostPlayerId !== player.id) {
            throw new Error('Только хост может начать игру');
          }

          const players = await RoomService.getPlayers(room.id);
          if (players.length < 4) {
            throw new Error('Минимум 4 игрока для начала');
          }

          await GameService.startGame(room.id);

          const apocalypses = await GameService.getRandomApocalypses(3);
          this.roomApocalypseOptions.set(room.id, apocalypses);

          callback({ success: true });

          this.io.to(`room:${room.code}`).emit('game:started', {
            state: RoomState.APOCALYPSE_VOTE,
          });

          setTimeout(() => {
            this.io.to(`room:${room.code}`).emit('apocalypse:options', { apocalypses });
          }, 1200);

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка старта игры';
          callback({ success: false, error: message });
        }
      });

      socket.on('room:fill-bots', async (_data: unknown, callback) => {
        try {
          const host = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(host.roomId);
          if (!room) throw new Error('Комната не найдена');

          const { players, addedBots } = await RoomService.fillRoomWithBots(host.id);

          callback({
            success: true,
            data: { addedBots: addedBots.length },
          });

          for (const bot of addedBots) {
            this.io.to(`room:${room.code}`).emit('player:joined', { player: bot });
            this.io.to(`room:${room.code}`).emit('player:online', { playerId: bot.id });
          }

          this.io.to(`room:${room.code}`).emit('room:update', {
            room,
            players,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка добавления ботов';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:apocalypse', async (data: VoteApocalypsePayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.state !== RoomState.APOCALYPSE_VOTE) {
            throw new Error('Голосование за апокалипсис уже завершено');
          }

          await GameService.voteApocalypse(player.roomId, player.id, data.apocalypseId);

          if (!player.isBot) {
            const availableApocalypseIds =
              this.roomApocalypseOptions.get(room.id)?.map((apocalypse) => apocalypse.id) || [data.apocalypseId];

            await this.runBotApocalypseVotes(room.id, availableApocalypseIds);
          }

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countApocalypseVotes(room.id);

          callback({ success: true });

          if (votes.reduce((sum, v) => sum + parseInt(v.count), 0) === players.length) {
            if (this.finalizingApocalypseRooms.has(room.id)) {
              return;
            }

            this.finalizingApocalypseRooms.add(room.id);

            try {
              const freshRoom = await RoomService.getRoom(room.id);
              if (!freshRoom || freshRoom.state !== RoomState.APOCALYPSE_VOTE) {
                return;
              }

              const latestVotes = await GameService.countApocalypseVotes(room.id);
              if (latestVotes.length === 0) {
                return;
              }

              const winnerId = parseInt(latestVotes[0].apocalypseId);
              this.roomApocalypseOptions.delete(room.id);
              await GameService.setApocalypse(room.id, winnerId);
              await this.emitRoomUpdate(room.id, room.code);

              this.io.to(`room:${room.code}`).emit('voting:apocalypse:complete', {
                winnerId,
                votes: latestVotes,
              });

              setTimeout(async () => {
                const actualRoom = await RoomService.getRoom(room.id);
                if (!actualRoom || actualRoom.state !== RoomState.LOCATION_VOTE) {
                  return;
                }

                const locations = await GameService.getRandomLocations(3);
                this.roomLocationOptions.set(room.id, locations);

                this.io.to(`room:${room.code}`).emit('location:options', { locations });

                setTimeout(async () => {
                  try {
                    await this.runBotLocationVotes(
                      room.id,
                      locations.map((location) => location.id)
                    );
                  } catch (error) {
                    console.error('Error processing bot location votes:', error);
                  }
                }, 500);
              }, 3000);
            } finally {
              this.finalizingApocalypseRooms.delete(room.id);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка голосования';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:location', async (data: VoteLocationPayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.state !== RoomState.LOCATION_VOTE) {
            throw new Error('Голосование за локацию уже завершено');
          }

          await GameService.voteLocation(player.roomId, player.id, data.locationId);

          const players = await RoomService.getPlayers(room.id);
          const votes = await GameService.countLocationVotes(room.id);

          callback({ success: true });

          if (votes.reduce((sum, v) => sum + parseInt(v.count), 0) === players.length) {
            if (this.finalizingLocationRooms.has(room.id)) {
              return;
            }

            this.finalizingLocationRooms.add(room.id);

            try {
              const freshRoom = await RoomService.getRoom(room.id);
              if (!freshRoom || freshRoom.state !== RoomState.LOCATION_VOTE) {
                return;
              }

              const latestVotes = await GameService.countLocationVotes(room.id);
              if (latestVotes.length === 0) {
                return;
              }

              const winnerId = parseInt(latestVotes[0].locationId);
              this.roomLocationOptions.delete(room.id);
              await GameService.setLocation(room.id, winnerId);
              await this.emitRoomUpdate(room.id, room.code);

              this.io.to(`room:${room.code}`).emit('voting:location:complete', {
                winnerId,
                votes: latestVotes,
              });

              setTimeout(async () => {
                const actualRoom = await RoomService.getRoom(room.id);
                if (!actualRoom || actualRoom.state !== RoomState.DEALING) {
                  return;
                }

                await GameService.dealCards(room.id);
                await this.emitRoomUpdate(room.id, room.code);
                await this.startDiscussionRound(room.id, room.code);
              }, 3000);
            } finally {
              this.finalizingLocationRooms.delete(room.id);
            }
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

          if (room.state !== RoomState.CARD_REVEAL) {
            throw new Error('Сейчас нельзя раскрывать карты');
          }

          const players = await RoomService.getPlayers(room.id);
          const currentPlayer = players.find((roomPlayer) => roomPlayer.id === player.id);
          const playerCard = currentPlayer?.cards?.find((card) => card.id === data.cardId);

          if (!playerCard) {
            throw new Error('Карта не принадлежит игроку');
          }

          if (playerCard.isRevealed) {
            throw new Error('Карта уже раскрыта');
          }

          const alreadyRevealedThisRound = currentPlayer?.cards?.some(
            (card) => card.revealedRound === room.currentRound
          );

          if (alreadyRevealedThisRound) {
            throw new Error('Можно раскрыть только одну карту за раунд');
          }

          await GameService.revealCard(data.cardId, room.currentRound);

          callback({ success: true });

          this.io.to(`room:${room.code}`).emit('card:revealed', {
            playerId: player.id,
            cardId: data.cardId,
          });

          await this.emitRoomUpdate(room.id, room.code);
          await this.tryStartVotingPhase(room.id, room.code, room.currentRound);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Ошибка раскрытия карты';
          callback({ success: false, error: message });
        }
      });

      socket.on('vote:player', async (data: VotePlayerPayload, callback) => {
        try {
          const player = await this.getConnectedPlayer(socket);

          if (!player.isAlive) {
            throw new Error('Выбывшие игроки не могут голосовать');
          }

          const room = await RoomService.getRoom(player.roomId);
          if (!room) throw new Error('Комната не найдена');

          if (room.state !== RoomState.VOTING) {
            throw new Error('Сейчас нельзя голосовать за исключение');
          }

          const players = await RoomService.getPlayers(room.id);
          const target = players.find((roomPlayer) => roomPlayer.id === data.targetPlayerId);

          if (!target || !target.isAlive) {
            throw new Error('Нельзя голосовать за выбывшего игрока');
          }

          await GameService.votePlayer(room.id, player.id, data.targetPlayerId, room.currentRound);

          callback({ success: true });
          await this.processPlayerVotingOutcome(room.id, room.code, room.currentRound);
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

      socket.on('disconnect', async (reason) => {
        console.log('Client disconnected:', socket.id, 'reason:', reason);

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
  await initializeDatabase();

  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const allowedOrigins = getAllowedOrigins();

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket-io',
      addTrailingSlash: false,
      cors: {
        origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
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
