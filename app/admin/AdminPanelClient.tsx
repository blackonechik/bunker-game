'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, showNotification } from '@/shared/ui';
import { CardType } from '@/lib/types';

type EntityKey = 'apocalypses' | 'cards' | 'locations';

interface ApocalypseRecord {
  id: number;
  name: string;
  description: string;
  hazardLevel: string;
  duration: string;
}

interface CardRecord {
  id: number;
  type: CardType;
  value: string;
  description?: string;
  rarity?: string;
}

interface LocationRecord {
  id: number;
  name: string;
  capacity: number;
  supplies: string[];
  condition: string;
  description: string;
}

interface EntityState {
  apocalypses: ApocalypseRecord[];
  cards: CardRecord[];
  locations: LocationRecord[];
}

const initialData: EntityState = {
  apocalypses: [],
  cards: [],
  locations: [],
};

export default function AdminPanelClient() {
  const [activeEntity, setActiveEntity] = useState<EntityKey>('apocalypses');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [data, setData] = useState<EntityState>(initialData);

  const [apocalypseForm, setApocalypseForm] = useState({
    name: '',
    description: '',
    hazardLevel: '',
    duration: '',
  });

  const [cardForm, setCardForm] = useState({
    type: CardType.PROFESSION,
    value: '',
    description: '',
    rarity: '',
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    capacity: '10',
    supplies: '',
    condition: '',
    description: '',
  });

  const currentRows = useMemo(() => data[activeEntity], [data, activeEntity]);

  const loadEntity = async (entity: EntityKey) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/${entity}`, { cache: 'no-store' });
      const body = (await response.json()) as { data?: unknown; error?: string };

      if (!response.ok) {
        throw new Error(body.error || 'Ошибка загрузки данных');
      }

      setData((prev) => ({
        ...prev,
        [entity]: Array.isArray(body.data) ? body.data : [],
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки данных';
      showNotification.error('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntity(activeEntity);
  }, [activeEntity]);

  const resetForms = () => {
    setEditingId(null);
    setApocalypseForm({ name: '', description: '', hazardLevel: '', duration: '' });
    setCardForm({ type: CardType.PROFESSION, value: '', description: '', rarity: '' });
    setLocationForm({ name: '', capacity: '10', supplies: '', condition: '', description: '' });
  };

  const toPayload = () => {
    if (activeEntity === 'apocalypses') {
      return {
        name: apocalypseForm.name,
        description: apocalypseForm.description,
        hazardLevel: apocalypseForm.hazardLevel,
        duration: apocalypseForm.duration,
      };
    }

    if (activeEntity === 'cards') {
      return {
        type: cardForm.type,
        value: cardForm.value,
        description: cardForm.description,
        rarity: cardForm.rarity,
      };
    }

    return {
      name: locationForm.name,
      capacity: Number(locationForm.capacity),
      supplies: locationForm.supplies
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      condition: locationForm.condition,
      description: locationForm.description,
    };
  };

  const submitForm = async () => {
    setSaving(true);
    try {
      const payload = toPayload();
      const isEditing = editingId !== null;
      const endpoint = isEditing
        ? `/api/admin/${activeEntity}/${editingId}`
        : `/api/admin/${activeEntity}`;

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'Ошибка сохранения');
      }

      showNotification.success('Готово', isEditing ? 'Запись обновлена' : 'Запись добавлена');
      resetForms();
      await loadEntity(activeEntity);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      showNotification.error('Ошибка', message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: ApocalypseRecord | CardRecord | LocationRecord) => {
    setEditingId(record.id);

    if (activeEntity === 'apocalypses') {
      const row = record as ApocalypseRecord;
      setApocalypseForm({
        name: row.name,
        description: row.description,
        hazardLevel: row.hazardLevel,
        duration: row.duration,
      });
      return;
    }

    if (activeEntity === 'cards') {
      const row = record as CardRecord;
      setCardForm({
        type: row.type,
        value: row.value,
        description: row.description || '',
        rarity: row.rarity || '',
      });
      return;
    }

    const row = record as LocationRecord;
    setLocationForm({
      name: row.name,
      capacity: String(row.capacity),
      supplies: row.supplies.join(', '),
      condition: row.condition,
      description: row.description,
    });
  };

  const handleDelete = async (id: number) => {
    const approved = window.confirm('Удалить запись?');
    if (!approved) return;

    try {
      const response = await fetch(`/api/admin/${activeEntity}/${id}`, {
        method: 'DELETE',
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'Ошибка удаления');
      }

      showNotification.success('Готово', 'Запись удалена');
      if (editingId === id) {
        resetForms();
      }
      await loadEntity(activeEntity);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка удаления';
      showNotification.error('Ошибка', message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export');
      const body = (await response.json()) as { error?: string; data?: unknown };

      if (!response.ok) {
        throw new Error(body.error || 'Ошибка экспорта');
      }

      const exportBody = JSON.stringify(body, null, 2);
      const blob = new Blob([exportBody], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bunker-admin-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showNotification.success('Готово', 'Файл экспорта скачан');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка экспорта';
      showNotification.error('Ошибка', message);
    }
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'Ошибка импорта');
      }

      showNotification.success('Готово', 'Данные импортированы');
      await loadEntity(activeEntity);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка импорта';
      showNotification.error('Ошибка', message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Админ панель</h1>
          <p className="text-sm text-zinc-400">Управление апокалипсисами, картами и локациями</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="small" variant="secondary" onClick={handleExport}>Экспорт JSON</Button>
          <label className="px-4 py-2 text-sm bg-zinc-800 border-2 border-zinc-600 text-zinc-200 font-bold uppercase tracking-wide cursor-pointer hover:border-emerald-500 transition-colors text-center">
            Импорт JSON
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button size="small" variant={activeEntity === 'apocalypses' ? 'primary' : 'secondary'} onClick={() => setActiveEntity('apocalypses')}>
          Апокалипсисы
        </Button>
        <Button size="small" variant={activeEntity === 'cards' ? 'primary' : 'secondary'} onClick={() => setActiveEntity('cards')}>
          Карты
        </Button>
        <Button size="small" variant={activeEntity === 'locations' ? 'primary' : 'secondary'} onClick={() => setActiveEntity('locations')}>
          Локации
        </Button>
      </div>

      <section className="border border-zinc-800 bg-black/40 p-4 space-y-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">{editingId ? 'Редактирование записи' : 'Новая запись'}</h2>

        {activeEntity === 'apocalypses' && (
          <div className="grid gap-3">
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Название" value={apocalypseForm.name} onChange={(event) => setApocalypseForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Опасность" value={apocalypseForm.hazardLevel} onChange={(event) => setApocalypseForm((prev) => ({ ...prev, hazardLevel: event.target.value }))} />
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Длительность" value={apocalypseForm.duration} onChange={(event) => setApocalypseForm((prev) => ({ ...prev, duration: event.target.value }))} />
            <textarea className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200 min-h-24" placeholder="Описание" value={apocalypseForm.description} onChange={(event) => setApocalypseForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
        )}

        {activeEntity === 'cards' && (
          <div className="grid gap-3">
            <select className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" value={cardForm.type} onChange={(event) => setCardForm((prev) => ({ ...prev, type: event.target.value as CardType }))}>
              {Object.values(CardType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Значение" value={cardForm.value} onChange={(event) => setCardForm((prev) => ({ ...prev, value: event.target.value }))} />
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Редкость" value={cardForm.rarity} onChange={(event) => setCardForm((prev) => ({ ...prev, rarity: event.target.value }))} />
            <textarea className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200 min-h-24" placeholder="Описание" value={cardForm.description} onChange={(event) => setCardForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
        )}

        {activeEntity === 'locations' && (
          <div className="grid gap-3">
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Название" value={locationForm.name} onChange={(event) => setLocationForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input type="number" className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Вместимость" value={locationForm.capacity} onChange={(event) => setLocationForm((prev) => ({ ...prev, capacity: event.target.value }))} />
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Состояние" value={locationForm.condition} onChange={(event) => setLocationForm((prev) => ({ ...prev, condition: event.target.value }))} />
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="Ресурсы (через запятую)" value={locationForm.supplies} onChange={(event) => setLocationForm((prev) => ({ ...prev, supplies: event.target.value }))} />
            <textarea className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200 min-h-24" placeholder="Описание" value={locationForm.description} onChange={(event) => setLocationForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="small" onClick={submitForm} disabled={saving}>{saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Добавить запись'}</Button>
          <Button size="small" variant="secondary" onClick={resetForms}>Сбросить</Button>
        </div>
      </section>

      <section className="border border-zinc-800 bg-black/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/70 text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Данные</th>
              <th className="text-right p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-zinc-500" colSpan={3}>Загрузка...</td>
              </tr>
            )}

            {!loading && currentRows.length === 0 && (
              <tr>
                <td className="p-4 text-zinc-500" colSpan={3}>Нет данных</td>
              </tr>
            )}

            {!loading && currentRows.map((row) => (
              <tr key={(row as { id: number }).id} className="border-t border-zinc-900">
                <td className="p-3 text-zinc-400">{(row as { id: number }).id}</td>
                <td className="p-3">
                  {activeEntity === 'apocalypses' && (
                    <div className="space-y-1 text-zinc-300">
                      <div className="font-bold">{(row as ApocalypseRecord).name}</div>
                      <div>{(row as ApocalypseRecord).description}</div>
                      <div className="text-xs text-zinc-500">Опасность: {(row as ApocalypseRecord).hazardLevel} • Длительность: {(row as ApocalypseRecord).duration}</div>
                    </div>
                  )}

                  {activeEntity === 'cards' && (
                    <div className="space-y-1 text-zinc-300">
                      <div className="font-bold">{(row as CardRecord).value}</div>
                      <div className="text-xs text-zinc-500">Тип: {(row as CardRecord).type}</div>
                      {(row as CardRecord).description && <div>{(row as CardRecord).description}</div>}
                    </div>
                  )}

                  {activeEntity === 'locations' && (
                    <div className="space-y-1 text-zinc-300">
                      <div className="font-bold">{(row as LocationRecord).name}</div>
                      <div>{(row as LocationRecord).description}</div>
                      <div className="text-xs text-zinc-500">Вместимость: {(row as LocationRecord).capacity} • Ресурсы: {(row as LocationRecord).supplies.join(', ') || '-'}</div>
                    </div>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-1 border border-emerald-600 text-emerald-400 hover:bg-emerald-950/40 transition-colors" onClick={() => handleEdit(row as ApocalypseRecord | CardRecord | LocationRecord)}>
                      Редактировать
                    </button>
                    <button className="px-3 py-1 border border-amber-600 text-amber-400 hover:bg-amber-950/40 transition-colors" onClick={() => handleDelete((row as { id: number }).id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}