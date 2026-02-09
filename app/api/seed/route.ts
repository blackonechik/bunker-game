import { NextResponse } from 'next/server';
import { seedDatabase } from '@/shared/api/db/seed';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'База данных успешно заполнена',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка заполнения БД';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
