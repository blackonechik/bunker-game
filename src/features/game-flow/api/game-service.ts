import { getDataSource } from '@/shared/api/db/data-source';
import { Apocalypse } from '@/lib/entities/Apocalypse';
import { Location } from '@/lib/entities/Location';
import { Card } from '@/lib/entities/Card';
import { Room } from '@/lib/entities/Room';
import { Player } from '@/lib/entities/Player';
import { PlayerCard } from '@/lib/entities/PlayerCard';
import { ApocalypseVote } from '@/lib/entities/ApocalypseVote';
import { LocationVote } from '@/lib/entities/LocationVote';
import { Vote } from '@/lib/entities/Vote';
import { ChatMessage } from '@/lib/entities/ChatMessage';
import { selectRandom } from '@/shared/lib/game';
import { RoomState, VoteType } from '@/shared/types';

export class GameService {
  static async startGame(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    await roomRepo.update(roomId, {
      state: RoomState.APOCALYPSE_VOTE,
      startedAt: new Date(),
    });
  }

  static async getRandomApocalypses(count: number = 3) {
    const ds = getDataSource();
    const apocalypseRepo = ds.getRepository(Apocalypse);
    
    const all = await apocalypseRepo.find();
    return selectRandom(all, Math.min(count, all.length));
  }

  static async getRandomLocations(count: number = 3) {
    const ds = getDataSource();
    const locationRepo = ds.getRepository(Location);
    
    const all = await locationRepo.find();
    return selectRandom(all, Math.min(count, all.length));
  }

  static async voteApocalypse(roomId: number, playerId: number, apocalypseId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(ApocalypseVote);

    await voteRepo.delete({ roomId, playerId });
    const vote = voteRepo.create({ roomId, playerId, apocalypseId });
    await voteRepo.save(vote);
  }

  static async voteLocation(roomId: number, playerId: number, locationId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(LocationVote);

    await voteRepo.delete({ roomId, playerId });
    const vote = voteRepo.create({ roomId, playerId, locationId });
    await voteRepo.save(vote);
  }

  static async countApocalypseVotes(roomId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(ApocalypseVote);

    const votes = await voteRepo
      .createQueryBuilder('vote')
      .select('vote.apocalypseId', 'apocalypseId')
      .addSelect('COUNT(*)', 'count')
      .where('vote.roomId = :roomId', { roomId })
      .groupBy('vote.apocalypseId')
      .orderBy('count', 'DESC')
      .getRawMany();

    return votes;
  }

  static async countLocationVotes(roomId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(LocationVote);

    const votes = await voteRepo
      .createQueryBuilder('vote')
      .select('vote.locationId', 'locationId')
      .addSelect('COUNT(*)', 'count')
      .where('vote.roomId = :roomId', { roomId })
      .groupBy('vote.locationId')
      .orderBy('count', 'DESC')
      .getRawMany();

    return votes;
  }

  static async dealCards(roomId: number) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);
    const cardRepo = ds.getRepository(Card);
    const playerCardRepo = ds.getRepository(PlayerCard);

    const players = await playerRepo.find({ where: { roomId, isAlive: true } });
    const allCards = await cardRepo.find();

    const cardsByType = allCards.reduce((acc, card) => {
      if (!acc[card.type]) acc[card.type] = [];
      acc[card.type].push(card);
      return acc;
    }, {} as Record<string, Card[]>);

    for (const type of Object.keys(cardsByType)) {
      const typeCards = cardsByType[type];
      if (typeCards.length < players.length) {
        throw new Error(`Недостаточно карт типа ${type} для уникальной раздачи`);
      }
    }

    const shuffledCardsByType = Object.fromEntries(
      Object.entries(cardsByType).map(([type, typeCards]) => [type, selectRandom(typeCards, typeCards.length)])
    ) as Record<string, Card[]>;

    for (const player of players) {
      for (const type of Object.keys(shuffledCardsByType)) {
        const randomCard = shuffledCardsByType[type].pop();
        if (!randomCard) {
          continue;
        }

        const playerCard = playerCardRepo.create({
          playerId: player.id,
          cardId: randomCard.id,
          isRevealed: false,
        });
        await playerCardRepo.save(playerCard);
      }
    }
  }

  static async revealCard(playerCardId: number, round: number) {
    const ds = getDataSource();
    const playerCardRepo = ds.getRepository(PlayerCard);

    await playerCardRepo.update(playerCardId, {
      isRevealed: true,
      revealedAt: new Date(),
      revealedRound: round,
    });
  }

  static async votePlayer(roomId: number, voterId: number, targetId: number, round: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(Vote);
    const playerRepo = ds.getRepository(Player);

    const [voter, target] = await Promise.all([
      playerRepo.findOne({ where: { id: voterId, roomId } }),
      playerRepo.findOne({ where: { id: targetId, roomId } }),
    ]);

    if (!voter || !voter.isAlive) {
      throw new Error('Выбывшие игроки не могут голосовать');
    }

    if (!target || !target.isAlive) {
      throw new Error('Нельзя голосовать за выбывшего игрока');
    }

    await voteRepo.delete({ roomId, voterId, round, type: VoteType.PLAYER });

    const vote = voteRepo.create({
      roomId,
      voterId,
      targetId,
      round,
      type: VoteType.PLAYER,
    });
    await voteRepo.save(vote);
  }

  static async countPlayerVotes(roomId: number, round: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(Vote);

    const votes = await voteRepo
      .createQueryBuilder('vote')
      .select('vote.targetId', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('vote.roomId = :roomId', { roomId })
      .andWhere('vote.round = :round', { round })
      .andWhere('vote.type = :type', { type: VoteType.PLAYER })
      .groupBy('vote.targetId')
      .orderBy('count', 'DESC')
      .getRawMany();

    return votes;
  }

  static async eliminatePlayer(playerId: number) {
    const ds = getDataSource();
    const playerRepo = ds.getRepository(Player);

    await playerRepo.update(playerId, { isAlive: false });
  }

  static async revealAllPlayerCards(playerId: number, round: number) {
    const ds = getDataSource();
    const playerCardRepo = ds.getRepository(PlayerCard);

    await playerCardRepo
      .createQueryBuilder()
      .update(PlayerCard)
      .set({
        isRevealed: true,
        revealedAt: new Date(),
        revealedRound: round,
      })
      .where('player_id = :playerId', { playerId })
      .execute();
  }

  static async setApocalypse(roomId: number, apocalypseId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    await roomRepo.update(roomId, { 
      apocalypseId,
      state: RoomState.LOCATION_VOTE 
    });
  }

  static async setLocation(roomId: number, locationId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    await roomRepo.update(roomId, { 
      locationId,
      state: RoomState.DEALING 
    });
  }

  static async getApocalypseVotes(roomId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(ApocalypseVote);

    return await voteRepo.find({ where: { roomId } });
  }

  static async getLocationVotes(roomId: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(LocationVote);

    return await voteRepo.find({ where: { roomId } });
  }

  static async startRound(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new Error('Room not found');

    await roomRepo.update(roomId, {
      currentRound: room.currentRound + 1,
      state: RoomState.DISCUSSION
    });
  }

  static async getPlayerVotes(roomId: number, round: number) {
    const ds = getDataSource();
    const voteRepo = ds.getRepository(Vote);

    return await voteRepo.find({
      where: { roomId, round, type: VoteType.PLAYER }
    });
  }

  static async endGame(roomId: number) {
    const ds = getDataSource();
    const roomRepo = ds.getRepository(Room);

    await roomRepo.update(roomId, { state: RoomState.FINISHED });
  }

  static async cleanupRoomData(roomId: number) {
    const ds = getDataSource();

    await ds.transaction(async (manager) => {
      const voteRepo = manager.getRepository(Vote);
      const apocalypseVoteRepo = manager.getRepository(ApocalypseVote);
      const locationVoteRepo = manager.getRepository(LocationVote);
      const chatMessageRepo = manager.getRepository(ChatMessage);
      const playerRepo = manager.getRepository(Player);
      const playerCardRepo = manager.getRepository(PlayerCard);
      const roomRepo = manager.getRepository(Room);

      await voteRepo.delete({ roomId });
      await apocalypseVoteRepo.delete({ roomId });
      await locationVoteRepo.delete({ roomId });
      await chatMessageRepo.delete({ roomId });

      const roomPlayers = await playerRepo.find({ where: { roomId } });
      const playerIds = roomPlayers.map((player) => player.id);

      if (playerIds.length > 0) {
        await playerCardRepo
          .createQueryBuilder()
          .delete()
          .where('player_id IN (:...playerIds)', { playerIds })
          .execute();
      }

      await playerRepo.delete({ roomId });
      await roomRepo.delete({ id: roomId });
    });
  }
}
