import { getDataSource } from '@/shared/api/db/data-source';
import { Room } from '@/lib/entities/Room';
import { Player } from '@/lib/entities/Player';
import { Session } from '@/lib/entities/Session';
import { generateRoomCode } from '@/shared/lib/game';
import { generateToken } from '@/shared/lib/jwt';
import { RoomState } from '@/shared/types';

export class RoomService {
  static async createRoom(maxPlayers: number, hardcore: boolean, playerName: string) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);
    const playerRepo = ds.getRepository(Player);
    const sessionRepo = ds.getRepository(Session);

    // Генерируем уникальный код
    let code = generateRoomCode();
    let attempts = 0;
    while (await roomRepo.findOne({ where: { code } }) && attempts < 10) {
      code = generateRoomCode();
      attempts++;
    }

    // Создаем комнату
    const room = roomRepo.create({
      code,
      maxPlayers,
      hardcore,
      state: RoomState.WAITING,
    });
    await roomRepo.save(room);

    // Создаем игрока (хоста)
    const player = playerRepo.create({
      name: playerName,
      roomId: room.id,
      isHost: true,
      isAlive: true,
    });
    await playerRepo.save(player);

    // Устанавливаем хоста
    room.hostPlayerId = player.id;
    await roomRepo.save(room);

    // Создаем сессию
    const token = generateToken({ playerId: player.id, roomId: room.id });
    const session = sessionRepo.create({
      playerId: player.id,
      token,
    });
    await sessionRepo.save(session);

    return { room, player, token };
  }

  static async joinRoom(code: string, playerName: string) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);
    const playerRepo = ds.getRepository(Player);
    const sessionRepo = ds.getRepository(Session);

    const room = await roomRepo.findOne({
      where: { code },
      relations: ['players'],
    });

    if (!room) {
      throw new Error('Комната не найдена');
    }

    if (room.state !== RoomState.WAITING) {
      throw new Error('Игра уже началась');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Комната заполнена');
    }

    // Создаем игрока
    const player = playerRepo.create({
      name: playerName,
      roomId: room.id,
      isHost: false,
      isAlive: true,
    });
    await playerRepo.save(player);

    // Создаем сессию
    const token = generateToken({ playerId: player.id, roomId: room.id });
    const session = sessionRepo.create({
      playerId: player.id,
      token,
    });
    await sessionRepo.save(session);

    return { room, player, token };
  }

  static async getRoom(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    return await roomRepo.findOne({
      where: { id: roomId },
      relations: ['players', 'apocalypse', 'location'],
    });
  }

  static async getRoomByCode(code: string) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    return await roomRepo.findOne({
      where: { code },
      relations: ['players', 'apocalypse', 'location'],
    });
  }

  static async deleteRoom(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    await roomRepo.delete(roomId);
  }

  static async getPlayers(roomId: number) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);
    
    return await playerRepo.find({
      where: { roomId },
      relations: ['cards', 'cards.card'],
    });
  }

  static async getPlayerById(playerId: number) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);
    
    return await playerRepo.findOne({
      where: { id: playerId },
      relations: ['room'],
    });
  }

  static async updateRoomState(roomId: number, state: RoomState) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);
    
    await roomRepo.update(roomId, { state });
  }

  static async setPlayerOnline(playerId: number, isOnline: boolean) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);
    
    await playerRepo.update(playerId, { isOnline });
    
    const player = await playerRepo.findOne({
      where: { id: playerId },
      relations: ['room'],
    });
    
    return player;
  }

  static async removePlayer(playerId: number, hostPlayerId: number) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);
    const sessionRepo = ds.getRepository(Session);
    
    const player = await playerRepo.findOne({
      where: { id: playerId },
      relations: ['room'],
    });
    
    if (!player) {
      throw new Error('Игрок не найден');
    }
    
    const host = await playerRepo.findOne({
      where: { id: hostPlayerId },
    });
    
    if (!host || !host.isHost || host.roomId !== player.roomId) {
      throw new Error('Только владелец комнаты может удалять игроков');
    }
    
    if (player.isHost) {
      throw new Error('Нельзя удалить владельца комнаты');
    }
    
    // Удаляем сессию
    await sessionRepo.delete({ playerId });
    
    // Удаляем игрока
    await playerRepo.remove(player);
    
    return { roomId: player.roomId, playerId };
  }
}
