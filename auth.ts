import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USERNAME || process.env.DB_USER || 'bunker',
  password: process.env.DB_PASSWORD || 'StrongPass123!',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'bunker_game',
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
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL, process.env.BETTER_AUTH_URL].filter(
    (origin): origin is string => Boolean(origin)
  ),
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  plugins: [nextCookies()],
});
