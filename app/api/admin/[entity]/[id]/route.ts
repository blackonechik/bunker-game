import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminRepositories,
  parseAdminEntity,
  parseEntityId,
  requireAdmin,
  validateApocalypsePayload,
  validateCardPayload,
  validateLocationPayload,
} from '@/shared/api/admin/utils';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { entity, id: idRaw } = await context.params;
  const parsedEntity = parseAdminEntity(entity);
  const id = parseEntityId(idRaw);

  if (!parsedEntity) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 404 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  try {
    const payload: unknown = await request.json();
    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    if (parsedEntity === 'apocalypses') {
      const existing = await apocalypseRepo.findOneBy({ id });
      if (!existing) {
        return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
      }

      const validated = validateApocalypsePayload(payload);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      apocalypseRepo.merge(existing, validated.data);
      const saved = await apocalypseRepo.save(existing);
      return NextResponse.json({ success: true, data: saved });
    }

    if (parsedEntity === 'cards') {
      const existing = await cardRepo.findOneBy({ id });
      if (!existing) {
        return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
      }

      const validated = validateCardPayload(payload);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      cardRepo.merge(existing, validated.data);
      const saved = await cardRepo.save(existing);
      return NextResponse.json({ success: true, data: saved });
    }

    const existing = await locationRepo.findOneBy({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    const validated = validateLocationPayload(payload);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    locationRepo.merge(existing, validated.data);
    const saved = await locationRepo.save(existing);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: unknown) {
    console.error('Error updating admin entity:', error);
    const message = error instanceof Error ? error.message : 'Ошибка обновления записи';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { entity, id: idRaw } = await context.params;
  const parsedEntity = parseAdminEntity(entity);
  const id = parseEntityId(idRaw);

  if (!parsedEntity) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 404 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  try {
    const { apocalypseRepo, cardRepo, locationRepo } = await getAdminRepositories();

    if (parsedEntity === 'apocalypses') {
      const existing = await apocalypseRepo.findOneBy({ id });
      if (!existing) {
        return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
      }

      await apocalypseRepo.remove(existing);
      return NextResponse.json({ success: true });
    }

    if (parsedEntity === 'cards') {
      const existing = await cardRepo.findOneBy({ id });
      if (!existing) {
        return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
      }

      await cardRepo.remove(existing);
      return NextResponse.json({ success: true });
    }

    const existing = await locationRepo.findOneBy({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    await locationRepo.remove(existing);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting admin entity:', error);
    const message = error instanceof Error ? error.message : 'Ошибка удаления записи';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}