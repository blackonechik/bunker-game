import { NextResponse } from 'next/server';
import { initializeDatabase, getDataSource } from '@/shared/api/db/data-source';
import { Location } from '@/entities/location';

export async function GET() {
  try {
    await initializeDatabase();
    const ds = getDataSource();
    const locationRepo = ds.getRepository(Location);

    const locations = await locationRepo.find();

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    const message = error instanceof Error ? error.message : 'Ошибка получения локаций';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
