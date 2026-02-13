import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminRepositories,
  requireAdmin,
  validateApocalypsePayload,
  validateCardPayload,
  validateLocationPayload,
} from '@/shared/api/admin/utils';

interface ImportPayload {
  data?: {
    apocalypses?: unknown[];
    cards?: unknown[];
    locations?: unknown[];
  };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const payload = (await request.json()) as ImportPayload;

    const apocalypsesRaw = Array.isArray(payload.data?.apocalypses) ? payload.data.apocalypses : [];
    const cardsRaw = Array.isArray(payload.data?.cards) ? payload.data.cards : [];
    const locationsRaw = Array.isArray(payload.data?.locations) ? payload.data.locations : [];

    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    let importedApocalypses = 0;
    for (const record of apocalypsesRaw) {
      const validated = validateApocalypsePayload(record);
      if (!validated.valid) {
        return NextResponse.json({ error: `apocalypses: ${validated.error}` }, { status: 400 });
      }

      const candidateId = typeof (record as { id?: unknown }).id === 'number' ? (record as { id: number }).id : undefined;
      if (candidateId && Number.isInteger(candidateId) && candidateId > 0) {
        const existing = await apocalypseRepo.findOneBy({ id: candidateId });
        if (existing) {
          apocalypseRepo.merge(existing, validated.data);
          await apocalypseRepo.save(existing);
          importedApocalypses += 1;
          continue;
        }

        const withId = apocalypseRepo.create({ ...validated.data, id: candidateId });
        await apocalypseRepo.save(withId);
        importedApocalypses += 1;
        continue;
      }

      const entityRecord = apocalypseRepo.create(validated.data);
      await apocalypseRepo.save(entityRecord);
      importedApocalypses += 1;
    }

    let importedCards = 0;
    for (const record of cardsRaw) {
      const validated = validateCardPayload(record);
      if (!validated.valid) {
        return NextResponse.json({ error: `cards: ${validated.error}` }, { status: 400 });
      }

      const candidateId = typeof (record as { id?: unknown }).id === 'number' ? (record as { id: number }).id : undefined;
      if (candidateId && Number.isInteger(candidateId) && candidateId > 0) {
        const existing = await cardRepo.findOneBy({ id: candidateId });
        if (existing) {
          cardRepo.merge(existing, validated.data);
          await cardRepo.save(existing);
          importedCards += 1;
          continue;
        }

        const withId = cardRepo.create({ ...validated.data, id: candidateId });
        await cardRepo.save(withId);
        importedCards += 1;
        continue;
      }

      const entityRecord = cardRepo.create(validated.data);
      await cardRepo.save(entityRecord);
      importedCards += 1;
    }

    let importedLocations = 0;
    for (const record of locationsRaw) {
      const validated = validateLocationPayload(record);
      if (!validated.valid) {
        return NextResponse.json({ error: `locations: ${validated.error}` }, { status: 400 });
      }

      const candidateId = typeof (record as { id?: unknown }).id === 'number' ? (record as { id: number }).id : undefined;
      if (candidateId && Number.isInteger(candidateId) && candidateId > 0) {
        const existing = await locationRepo.findOneBy({ id: candidateId });
        if (existing) {
          locationRepo.merge(existing, validated.data);
          await locationRepo.save(existing);
          importedLocations += 1;
          continue;
        }

        const withId = locationRepo.create({ ...validated.data, id: candidateId });
        await locationRepo.save(withId);
        importedLocations += 1;
        continue;
      }

      const entityRecord = locationRepo.create(validated.data);
      await locationRepo.save(entityRecord);
      importedLocations += 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        apocalypses: importedApocalypses,
        cards: importedCards,
        locations: importedLocations,
      },
    });
  } catch (error: unknown) {
    console.error('Error importing admin data:', error);
    const message = error instanceof Error ? error.message : 'Ошибка импорта данных';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}