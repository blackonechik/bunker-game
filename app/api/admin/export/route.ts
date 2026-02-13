import { NextResponse } from 'next/server';
import { getAdminRepositories, requireAdmin } from '@/shared/api/admin/utils';

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    const [apocalypses, cards, locations] = await Promise.all([
      apocalypseRepo.find({ order: { id: 'ASC' } }),
      cardRepo.find({ order: { id: 'ASC' } }),
      locationRepo.find({ order: { id: 'ASC' } }),
    ]);

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        apocalypses,
        cards,
        locations,
      },
    });
  } catch (error: unknown) {
    console.error('Error exporting admin data:', error);
    const message = error instanceof Error ? error.message : 'Ошибка экспорта данных';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}