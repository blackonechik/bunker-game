import { NextResponse } from 'next/server';
import {
  encodeRoomStartParam,
  getTelegramShareLink,
} from '@/src/shared/lib/telegram-miniapp-link';

const CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const normalizedCode = code.trim().toUpperCase();

  if (!CODE_PATTERN.test(normalizedCode)) {
    return NextResponse.json({ success: false, error: 'Некорректный код комнаты' }, { status: 400 });
  }

  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();

  const miniAppShortName =
    process.env.TELEGRAM_MINI_APP_SHORT_NAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_SHORT_NAME?.trim();

  if (!botUsername) {
    return NextResponse.json(
      {
        success: false,
        error: 'Telegram bot username is not configured',
      },
      { status: 500 }
    );
  }

  const shareLink = getTelegramShareLink({
    roomCode: normalizedCode,
    botUsername,
    miniAppShortName,
  });

  return NextResponse.json({
    success: true,
    data: {
      shareLink,
      startParam: encodeRoomStartParam(normalizedCode),
    },
  });
}
