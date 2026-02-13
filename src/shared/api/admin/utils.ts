import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { initializeDatabase, getDataSource } from '@/shared/api/db/data-source';
import { Apocalypse } from '@/lib/entities/Apocalypse';
import { Card } from '@/lib/entities/Card';
import { Location } from '@/lib/entities/Location';
import { CardType } from '@/lib/types';

export type AdminEntity = 'apocalypses' | 'cards' | 'locations';

export interface AdminAuthSuccess {
  userId: string;
  role: string;
}

export async function requireAdmin(): Promise<{ ok: true; data: AdminAuthSuccess } | { ok: false; response: NextResponse }> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 }),
    };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Доступ только для администраторов' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    data: {
      userId: session.user.id,
      role,
    },
  };
}

export function parseAdminEntity(entity: string): AdminEntity | null {
  if (entity === 'apocalypses' || entity === 'cards' || entity === 'locations') {
    return entity;
  }

  return null;
}

export function parseEntityId(idRaw: string): number | null {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function getAdminRepositories() {
  await initializeDatabase();
  const ds = getDataSource();

  return {
    apocalypseRepo: ds.getRepository(Apocalypse),
    cardRepo: ds.getRepository(Card),
    locationRepo: ds.getRepository(Location),
  };
}

export function validateApocalypsePayload(payload: unknown): { valid: true; data: Omit<Apocalypse, 'id'> } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Некорректный формат апокалипсиса' };
  }

  const source = payload as Record<string, unknown>;
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  const description = typeof source.description === 'string' ? source.description.trim() : '';
  const hazardLevel = typeof source.hazardLevel === 'string' ? source.hazardLevel.trim() : '';
  const duration = typeof source.duration === 'string' ? source.duration.trim() : '';

  if (!name) return { valid: false, error: 'Поле name обязательно' };
  if (!description) return { valid: false, error: 'Поле description обязательно' };
  if (!hazardLevel) return { valid: false, error: 'Поле hazardLevel обязательно' };
  if (!duration) return { valid: false, error: 'Поле duration обязательно' };

  return {
    valid: true,
    data: {
      name,
      description,
      hazardLevel,
      duration,
    },
  };
}

export function validateCardPayload(payload: unknown): { valid: true; data: Omit<Card, 'id'> } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Некорректный формат карты' };
  }

  const source = payload as Record<string, unknown>;
  const typeRaw = typeof source.type === 'string' ? source.type : '';
  const value = typeof source.value === 'string' ? source.value.trim() : '';
  const description = typeof source.description === 'string' ? source.description.trim() : undefined;
  const rarity = typeof source.rarity === 'string' ? source.rarity.trim() : undefined;

  if (!Object.values(CardType).includes(typeRaw as CardType)) {
    return { valid: false, error: 'Некорректный type для карты' };
  }

  if (!value) {
    return { valid: false, error: 'Поле value обязательно' };
  }

  return {
    valid: true,
    data: {
      type: typeRaw as CardType,
      value,
      description,
      rarity,
    },
  };
}

export function validateLocationPayload(payload: unknown): { valid: true; data: Omit<Location, 'id'> } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Некорректный формат локации' };
  }

  const source = payload as Record<string, unknown>;
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  const capacityRaw = source.capacity;
  const condition = typeof source.condition === 'string' ? source.condition.trim() : '';
  const description = typeof source.description === 'string' ? source.description.trim() : '';

  let supplies: string[] = [];
  if (Array.isArray(source.supplies)) {
    supplies = source.supplies
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  if (!name) return { valid: false, error: 'Поле name обязательно' };
  if (!Number.isInteger(capacityRaw) || (capacityRaw as number) <= 0) {
    return { valid: false, error: 'Поле capacity должно быть целым числом > 0' };
  }
  if (!condition) return { valid: false, error: 'Поле condition обязательно' };
  if (!description) return { valid: false, error: 'Поле description обязательно' };

  return {
    valid: true,
    data: {
      name,
      capacity: capacityRaw as number,
      supplies,
      condition,
      description,
    },
  };
}