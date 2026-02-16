const START_PARAM_PREFIX = 'room_';

export const encodeRoomStartParam = (roomCode: string): string => {
  return `${START_PARAM_PREFIX}${roomCode.trim().toUpperCase()}`;
};

export const parseRoomCodeFromStartParam = (startParam: string): string | null => {
  const value = startParam.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith(START_PARAM_PREFIX)) {
    const roomCode = value.slice(START_PARAM_PREFIX.length).toUpperCase();
    return roomCode || null;
  }

  if (/^[A-Z0-9]{4,12}$/i.test(value)) {
    return value.toUpperCase();
  }

  return null;
};

export const getTelegramBotMiniAppLink = (roomCode: string): string | null => {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  const miniAppShortName = process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_SHORT_NAME?.trim();

  if (!botUsername) {
    return null;
  }

  const safeUsername = botUsername.replace(/^@/, '');
  const startParam = encodeRoomStartParam(roomCode);

  if (miniAppShortName) {
    return `https://t.me/${safeUsername}/${miniAppShortName}?startapp=${encodeURIComponent(startParam)}`;
  }

  return `https://t.me/${safeUsername}?startapp=${encodeURIComponent(startParam)}`;
};

export const getTelegramStartParamFromLocation = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);

  return (
    url.searchParams.get('tgWebAppStartParam') ??
    url.searchParams.get('startapp') ??
    ''
  );
};
