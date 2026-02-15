'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, showNotification } from '@/shared/ui';
import { CardType } from '@/lib/types';

type EntityKey = 'apocalypses' | 'cards' | 'locations';

interface ApocalypseRecord {
  id: number;
  name: string;
  description: string;
  image: string;
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
  description: string;
  image: string;
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
  const [purging, setPurging] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [data, setData] = useState<EntityState>(initialData);

  const [apocalypseForm, setApocalypseForm] = useState({
    name: '',
    description: '',
    image: '',
  });

  const [cardForm, setCardForm] = useState({
    type: CardType.PROFESSION,
    value: '',
    description: '',
    rarity: '',
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    description: '',
    image: '',
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
    setApocalypseForm({ name: '', description: '', image: '' });
    setCardForm({ type: CardType.PROFESSION, value: '', description: '', rarity: '' });
    setLocationForm({ name: '', description: '', image: '' });
  };

  const toPayload = () => {
    if (activeEntity === 'apocalypses') {
      return {
        name: apocalypseForm.name,
        description: apocalypseForm.description,
        image: apocalypseForm.image,
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
      description: locationForm.description,
      image: locationForm.image,
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
        image: row.image,
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
      description: row.description,
      image: row.image,
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

  const handlePurgeGames = async () => {
    const approved = window.confirm(
      'Это удалит все игровые данные (голоса, карты игроков, игроков и комнаты). Продолжить?'
    );

    if (!approved) {
      return;
    }

    const confirmation = window.prompt('Введите DELETE_GAME_DATA для подтверждения:');
    if (!confirmation) {
      return;
    }

    setPurging(true);

    try {
      const response = await fetch('/api/admin/purge-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmation.trim() }),
      });

      const body = (await response.json()) as {
        error?: string;
        data?: {
          stats?: Record<string, { before?: number; deleted?: number }>;
        };
      };

      if (!response.ok) {
        throw new Error(body.error || 'Ошибка очистки игровых таблиц');
      }

      const stats = body.data?.stats;
      if (stats) {
        const totalDeleted = Object.values(stats).reduce((acc, value) => {
          const deleted = typeof value.deleted === 'number' ? value.deleted : 0;
          return acc + deleted;
        }, 0);

        showNotification.success('Готово', `Игровые таблицы очищены. Удалено записей: ${totalDeleted}`);
      } else {
        showNotification.success('Готово', 'Игровые таблицы очищены');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка очистки игровых таблиц';
      showNotification.error('Ошибка', message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-row items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:justify-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Админ панель</h1>
          <p className="text-sm text-zinc-400">Управление апокалипсисами, картами и локациями</p>
        </div>

        <div className="flex flex-row max-sm:flex-col gap-3">
          <Button size="small" variant="secondary" onClick={handleExport}>Экспорт JSON</Button>
          <label className="px-4 py-2 text-sm bg-zinc-800 border-2 border-zinc-600 text-zinc-200 font-bold uppercase tracking-wide cursor-pointer hover:border-emerald-500 transition-colors text-center">
            Импорт JSON
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
          <Button size="small" variant="secondary" onClick={handlePurgeGames} disabled={purging}>
            {purging ? 'Очистка...' : 'Очистить игровые таблицы'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-3">
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
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="URL изображения" value={apocalypseForm.image} onChange={(event) => setApocalypseForm((prev) => ({ ...prev, image: event.target.value }))} />
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
            <input className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200" placeholder="URL изображения" value={locationForm.image} onChange={(event) => setLocationForm((prev) => ({ ...prev, image: event.target.value }))} />
            <textarea className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 text-zinc-200 min-h-24" placeholder="Описание" value={locationForm.description} onChange={(event) => setLocationForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
        )}

        <div className="flex flex-row max-sm:flex-col gap-3">
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
                      <div className="text-xs text-zinc-500 break-all">Изображение: {(row as ApocalypseRecord).image}</div>
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
                      <div className="text-xs text-zinc-500 break-all">Изображение: {(row as LocationRecord).image}</div>
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