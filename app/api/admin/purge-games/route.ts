import { NextRequest, NextResponse } from 'next/server';
import { getDataSource, initializeDatabase } from '@/shared/api/db/data-source';
import { requireAdmin } from '@/shared/api/admin/utils';

const CONFIRMATION_PHRASE = 'DELETE_GAME_DATA';
const GAME_TABLES = [
  'apocalypse_votes',
  'location_votes',
  'votes',
  'player_cards',
  'players',
  'rooms',
] as const;

type PurgeRequestBody = {
  confirmation?: string;
};

const parseCountResult = (rows: unknown): number => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  const firstRow = rows[0] as { count?: unknown };
  const count = Number(firstRow.count);
  return Number.isFinite(count) ? count : 0;
};

const parseAffectedRows = (result: unknown): number => {
  if (!result || typeof result !== 'object') {
    return 0;
  }

  const affectedRows = Number((result as { affectedRows?: unknown }).affectedRows);
  return Number.isFinite(affectedRows) ? affectedRows : 0;
};

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  const requestOrigin = request.headers.get('origin');
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : request.nextUrl.origin;

  if (!requestOrigin || requestOrigin !== allowedOrigin) {
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as PurgeRequestBody;

    if (body.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { error: `Для подтверждения передайте confirmation: ${CONFIRMATION_PHRASE}` },
        { status: 400 }
      );
    }

    await initializeDatabase();
    const ds = getDataSource();
    const queryRunner = ds.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stats: Record<string, { before: number; deleted: number }> = {};

      for (const tableName of GAME_TABLES) {
        const countRows = await queryRunner.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const before = parseCountResult(countRows);

        const deleteResult = await queryRunner.query(`DELETE FROM ${tableName}`);
        const deleted = parseAffectedRows(deleteResult);

        stats[tableName] = {
          before,
          deleted,
        };
      }

      await queryRunner.commitTransaction();

      console.warn('[admin] Game tables purged', {
        byUserId: authResult.data.userId,
        ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
        at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          confirmationPhrase: CONFIRMATION_PHRASE,
          stats,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error: unknown) {
    console.error('Error purging game tables:', error);
    const message = error instanceof Error ? error.message : 'Ошибка очистки игровых таблиц';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
