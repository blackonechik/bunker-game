import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { initializeDatabase } from '@/shared/api/db/data-source';
import { RoomService } from '@/src/features/room-management/api/room-service';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { maxPlayers, hardcore, playerName } = body;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    if (!playerName || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Имя игрока обязательно' },
        { status: 400 }
      );
    }

    if (maxPlayers < 4 || maxPlayers > 16) {
      return NextResponse.json(
        { error: 'Количество игроков должно быть от 4 до 16' },
        { status: 400 }
      );
    }

    const result = await RoomService.createRoom(maxPlayers, hardcore || false, playerName, session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        code: result.room.code,
        roomId: result.room.id,
        playerId: result.player.id,
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/join/${result.room.code}`,
      },
    });
  } catch (error: unknown) {
    console.error('Error creating room:', error);
    const message = error instanceof Error ? error.message : 'Ошибка создания комнаты';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
