import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/shared/api/db/data-source';
import { RoomService } from '@/src/features/room-management/api/room-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    await initializeDatabase();
    const { code } = await context.params;

    const room = await RoomService.getRoomByCode(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Комната не найдена' },
        { status: 404 }
      );
    }

    const players = await RoomService.getPlayers(room.id);

    return NextResponse.json({
      success: true,
      data: { room, players },
    });
  } catch (error: unknown) {
    console.error('Error fetching room:', error);
    const message = error instanceof Error ? error.message : 'Ошибка получения данных комнаты';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    await initializeDatabase();
    const { code } = await context.params;

    const body = await request.json();
    const { playerName } = body;

    if (!playerName || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Имя игрока обязательно' },
        { status: 400 }
      );
    }

    const result = await RoomService.joinRoom(code, playerName);

    return NextResponse.json({
      success: true,
      data: {
        roomId: result.room.id,
        playerId: result.player.id,
        token: result.token,
        room: result.room,
      },
    });
  } catch (error: unknown) {
    console.error('Error joining room:', error);
    const message = error instanceof Error ? error.message : 'Ошибка присоединения к комнате';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
