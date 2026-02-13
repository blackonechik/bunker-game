import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminRepositories,
  parseAdminEntity,
  requireAdmin,
  validateApocalypsePayload,
  validateCardPayload,
  validateLocationPayload,
} from '@/shared/api/admin/utils';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { entity } = await context.params;
  const parsedEntity = parseAdminEntity(entity);

  if (!parsedEntity) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 404 });
  }

  try {
    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    if (parsedEntity === 'apocalypses') {
      const data = await apocalypseRepo.find({ order: { id: 'ASC' } });
      return NextResponse.json({ success: true, data });
    }

    if (parsedEntity === 'cards') {
      const data = await cardRepo.find({ order: { id: 'ASC' } });
      return NextResponse.json({ success: true, data });
    }

    const data = await locationRepo.find({ order: { id: 'ASC' } });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error fetching admin entity list:', error);
    const message = error instanceof Error ? error.message : 'Ошибка получения данных';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { entity } = await context.params;
  const parsedEntity = parseAdminEntity(entity);

  if (!parsedEntity) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 404 });
  }

  try {
    const payload: unknown = await request.json();
    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    if (parsedEntity === 'apocalypses') {
      const validated = validateApocalypsePayload(payload);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      const entityRecord = apocalypseRepo.create(validated.data);
      const saved = await apocalypseRepo.save(entityRecord);
      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    }

    if (parsedEntity === 'cards') {
      const validated = validateCardPayload(payload);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      const entityRecord = cardRepo.create(validated.data);
      const saved = await cardRepo.save(entityRecord);
      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    }

    const validated = validateLocationPayload(payload);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const entityRecord = locationRepo.create(validated.data);
    const saved = await locationRepo.save(entityRecord);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating admin entity:', error);
    const message = error instanceof Error ? error.message : 'Ошибка создания записи';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}