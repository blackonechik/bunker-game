
import { Room } from '../entities/Room';
import { Player } from '../entities/Player';
import { Session } from '../entities/Session';
import { Apocalypse } from '../entities/Apocalypse';
import { Location } from '../entities/Location';
import { generateRoomCode } from '../utils/game';
import { generateToken } from '../utils/jwt';
import { RoomState } from '../types';
import { getDataSource } from '@/src/shared/api/db/data-source';

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

  static async updateRoomState(roomId: number, state: RoomState) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);
    
    await roomRepo.update(roomId, { state });
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

  static async getRoomById(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);
    
    return await roomRepo.findOne({
      where: { id: roomId },
      relations: ['players', 'apocalypse', 'location'],
    });
  }

  static async getRandomApocalypses(count: number = 3) {
    const ds = getDataSource();
    const apocalypseRepo = ds.getRepository(Apocalypse);
    
    const all = await apocalypseRepo.find();
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, all.length));
  }

  static async getRandomLocations(count: number = 3) {
    const ds = getDataSource();
    const locationRepo = ds.getRepository(Location);
    
    const all = await locationRepo.find();
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, all.length));
  }
}
