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

type TelegramInviteLinkOptions = {
  roomCode: string;
  botUsername: string;
  miniAppShortName?: string;
};

export const getTelegramBotMiniAppLink = ({
  roomCode,
  botUsername,
  miniAppShortName,
}: TelegramInviteLinkOptions): string => {
  const safeUsername = botUsername.trim().replace(/^@/, '');
  const safeMiniAppShortName = miniAppShortName?.trim();
  const startParam = encodeRoomStartParam(roomCode);

  if (safeMiniAppShortName) {
    return `https://t.me/${safeUsername}/${safeMiniAppShortName}?startapp=${encodeURIComponent(startParam)}`;
  }

  return `https://t.me/${safeUsername}?startapp=${encodeURIComponent(startParam)}`;
};

export const getTelegramShareLink = (options: TelegramInviteLinkOptions): string => {
  const inviteUrl = getTelegramBotMiniAppLink(options);
  const message = `Присоединяйся к игре в Бункер! Код комнаты: ${options.roomCode.trim().toUpperCase()}`;

  return `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(message)}`;
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
