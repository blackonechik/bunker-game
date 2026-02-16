import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { createPool } from 'mysql2/promise';
import { createAuthEndpoint, APIError } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import * as z from 'zod';
import {
  TELEGRAM_EMAIL_DOMAIN,
  buildTelegramDisplayName,
  parseAndValidateTelegramInitData,
} from '@/src/shared/lib/telegram-auth';

const normalizeOrigin = (origin: string): string | null => {
  const value = origin.trim();

  if (!value) {
    return null;
  }

  if (value.includes('*')) {
    return value;
  }

  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};

const trustedOrigins = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []),
    ]
      .filter((origin): origin is string => Boolean(origin))
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin))
  )
);

const pool = createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
});

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;

const telegramMiniAppPlugin = {
  id: 'telegram-miniapp',
  endpoints: {
    telegramMiniApp: createAuthEndpoint(
      '/telegram/miniapp',
      {
        method: 'POST',
        body: z.object({
          initData: z.string().min(1),
        }),
      },
      async (ctx) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: 'TELEGRAM_BOT_TOKEN is not configured',
          });
        }

        const maxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE ?? '300');
        let validated;

        try {
          validated = parseAndValidateTelegramInitData(ctx.body.initData, botToken, maxAge);
        } catch (error) {
          throw new APIError('UNAUTHORIZED', {
            message: error instanceof Error ? error.message : 'Telegram initData is invalid',
          });
        }

        const userData = validated.user;

        const telegramEmail = `tg_${userData.id}@${TELEGRAM_EMAIL_DOMAIN}`;
        const userName = buildTelegramDisplayName(userData);

        const existingUser = await ctx.context.internalAdapter.findUserByEmail(telegramEmail);

        let user = existingUser?.user;

        if (!user) {
          const created = await ctx.context.internalAdapter.createOAuthUser(
            {
              email: telegramEmail,
              emailVerified: true,
              name: userName,
              image: userData.photo_url ?? null,
            },
            {
              providerId: 'telegram-miniapp',
              accountId: String(userData.id),
            }
          );

          user = created.user;
        }

        const session = await ctx.context.internalAdapter.createSession(user.id);

        await setSessionCookie(ctx, {
          user,
          session,
        });

        return ctx.json({
          ok: true,
          user,
        });
      }
    ),
  },
};

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
        returned: true,
      },
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  plugins: [nextCookies(), telegramMiniAppPlugin],
});
