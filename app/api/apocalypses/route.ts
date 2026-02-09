import { NextResponse } from 'next/server';
import { initializeDatabase, getDataSource } from '@/lib/db/data-source';
import { Apocalypse } from '@/lib/entities/Apocalypse';

export async function GET() {
  try {
    await initializeDatabase();
    const ds = getDataSource();
    const apocalypseRepo = ds.getRepository(Apocalypse);

    const apocalypses = await apocalypseRepo.find();

    return NextResponse.json({
      success: true,
      data: apocalypses,
    });
  } catch (error) {
    console.error('Error fetching apocalypses:', error);
    const message = error instanceof Error ? error.message : 'Ошибка получения апокалипсисов';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
