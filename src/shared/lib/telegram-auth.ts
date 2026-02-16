import crypto from 'node:crypto';

export const TELEGRAM_EMAIL_DOMAIN = 'telegram.local';

type TelegramInitDataUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

type TelegramInitDataValidated = {
  user: TelegramInitDataUser;
  authDate: number;
  hash: string;
};

const replayCache = new Map<string, number>();

const cleanupReplayCache = (nowSeconds: number) => {
  for (const [hash, expiresAt] of replayCache.entries()) {
    if (expiresAt <= nowSeconds) {
      replayCache.delete(hash);
    }
  }
};

const timingSafeEqualHex = (leftHex: string, rightHex: string): boolean => {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
};

const getTelegramSecretKey = (botToken: string): Buffer => {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
};

const parseUser = (rawUser: string): TelegramInitDataUser => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawUser);
  } catch {
    throw new Error('Invalid Telegram user payload');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Telegram user payload is empty');
  }

  const maybeUser = parsed as Partial<TelegramInitDataUser>;
  const numericId = Number(maybeUser.id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error('Telegram user id is invalid');
  }

  return {
    id: numericId,
    first_name: maybeUser.first_name,
    last_name: maybeUser.last_name,
    username: maybeUser.username,
    photo_url: maybeUser.photo_url,
    language_code: maybeUser.language_code,
  };
};

export const buildTelegramDisplayName = (user: TelegramInitDataUser): string => {
  const firstName = user.first_name?.trim() ?? '';
  const lastName = user.last_name?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (fullName) {
    return fullName;
  }

  if (user.username?.trim()) {
    return user.username.trim();
  }

  return `Telegram User ${user.id}`;
};

export const parseAndValidateTelegramInitData = (
  initData: string,
  botToken: string,
  maxAgeSeconds: number
): TelegramInitDataValidated => {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const userRaw = params.get('user');
  const authDateRaw = params.get('auth_date');

  if (!hash || !userRaw || !authDateRaw) {
    throw new Error('Telegram initData is incomplete');
  }

  const entries: Array<[string, string]> = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash') {
      continue;
    }
    entries.push([key, value]);
  }

  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = getTelegramSecretKey(botToken);
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeEqualHex(calculatedHash, hash)) {
    throw new Error('Telegram initData hash is invalid');
  }

  const authDate = Number(authDateRaw);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(authDate)) {
    throw new Error('Telegram auth_date is invalid');
  }

  if (authDate > nowSeconds + 30) {
    throw new Error('Telegram auth_date is from the future');
  }

  const normalizedMaxAge = Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0 ? maxAgeSeconds : 300;
  if (nowSeconds - authDate > normalizedMaxAge) {
    throw new Error('Telegram initData is expired');
  }

  cleanupReplayCache(nowSeconds);
  if (replayCache.has(hash)) {
    throw new Error('Telegram initData replay detected');
  }
  replayCache.set(hash, nowSeconds + normalizedMaxAge);

  const user = parseUser(userRaw);

  return {
    user,
    authDate,
    hash,
  };
};
