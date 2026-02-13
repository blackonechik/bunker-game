import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { createPool } from 'mysql2/promise';

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
  plugins: [nextCookies()],
});
