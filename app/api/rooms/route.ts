import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { initializeDatabase } from '@/shared/api/db/data-source';
import { RoomService, TooManyActiveRoomsError } from '@/src/features/room-management/api/room-service';

const ROOM_CREATE_WINDOW_MS = 60_000;
const ROOM_CREATE_MAX_REQUESTS = 5;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const roomCreateRateLimitStore = new Map<string, RateLimitEntry>();
let lastRateLimitCleanupAt = 0;

const getClientIp = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
};

const checkAndConsumeRateLimit = (key: string) => {
  const now = Date.now();

  if (now - lastRateLimitCleanupAt > ROOM_CREATE_WINDOW_MS) {
    for (const [entryKey, value] of roomCreateRateLimitStore.entries()) {
      if (value.expiresAt <= now) {
        roomCreateRateLimitStore.delete(entryKey);
      }
    }
    lastRateLimitCleanupAt = now;
  }

  const existing = roomCreateRateLimitStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    roomCreateRateLimitStore.set(key, {
      count: 1,
      expiresAt: now + ROOM_CREATE_WINDOW_MS,
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= ROOM_CREATE_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
    return { limited: true, retryAfterSeconds };
  }

  existing.count += 1;
  roomCreateRateLimitStore.set(key, existing);
  return { limited: false, retryAfterSeconds: 0 };
};

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

    const clientIp = getClientIp(request);
    const rateLimitKey = `${session.user.id}:${clientIp}`;
    const rateLimitResult = checkAndConsumeRateLimit(rateLimitKey);

    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        }
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

    if (error instanceof TooManyActiveRoomsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Ошибка создания комнаты';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
