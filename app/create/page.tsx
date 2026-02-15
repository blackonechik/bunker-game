'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from '@/shared/lib/auth-client';
import { useSocketEmit } from '@/shared/hooks/use-socket';
import { Button, Logo, RoomCard, RangeSlider, CodeInput, showNotification } from '@/src/shared/ui';
import type { RoomCreateResponse, RoomJoinResponse } from '@/src/shared/types';

export default function CreatePage() {
  const router = useRouter();
  const { emit } = useSocketEmit();
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [roomCode, setRoomCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!session) {
      await signIn.social({ provider: 'google', callbackURL: '/create' });
      return;
    }

    const trimmedName = session.user.name?.trim() || '';

    if (!trimmedName) {
      showNotification.error('Ошибка профиля', 'Не удалось получить имя из профиля Google');
      return;
    }

    setLoading(true);

    try {
      const result = await emit<RoomCreateResponse>('room:create', {
        maxPlayers,
        hardcore: false,
        playerName: trimmedName,
      });

      showNotification.success('Комната создана', `Код доступа: ${result.code}`);

      // Переходим в лобби
      router.push(`/lobby/${result.code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания комнаты';
      showNotification.error('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) {
      await signIn.social({ provider: 'google', callbackURL: '/create' });
      return;
    }

    const code = roomCode.join('');
    const trimmedName = session.user.name?.trim() || '';
    
    if (!trimmedName) {
      showNotification.error('Ошибка профиля', 'Не удалось получить имя из профиля Google');
      return;
    }

    if (code.length !== 4) {
      showNotification.error('Ошибка валидации', 'Введите код комнаты (4 символа)');
      return;
    }

    setLoading(true);

    try {
      const normalizedCode = code.toUpperCase();

      await emit<RoomJoinResponse>('room:join', {
        code: normalizedCode,
        playerName: trimmedName,
      });

      showNotification.success('Подключение успешно', 'Добро пожаловать в убежище!');

      // Переходим в лобби
      router.push(`/lobby/${normalizedCode}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа в комнату';
      showNotification.error('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <div className="flex flex-col gap-4 items-center">
        {/* Кнопка назад */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 self-start"
        >
          <Button 
            variant="secondary" 
            size='small'
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </Button>
        </motion.div>
        
        <Logo className='m-4'/>

        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Создать комнату */}
          <RoomCard mode="create" isActive={mode === 'create'} onFocus={() => setMode('create')} delay={0.2}>
            <RangeSlider
              label={`Игроков: ${maxPlayers}`}
              variant="emerald"
              min={4}
              max={16}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              onFocus={() => setMode('create')}
            />

            {mode === 'create' && (
              <Button
                onClick={handleCreate}
                disabled={loading}
                variant="primary"
                className="w-full"
              >
                {loading ? 'Создание...' : session ? 'Сгенерировать код' : 'Войти через Google'}
              </Button>
            )}
          </RoomCard>
          

          {/* Присоединиться к убежищу */}
          <RoomCard mode="join" isActive={mode === 'join'} onFocus={() => setMode('join')} delay={0.3}>
            <CodeInput
              label="Код доступа"
              variant="amber"
              value={roomCode}
              onChange={setRoomCode}
              onFocus={() => setMode('join')}
            />

            {mode === 'join' && (
              <Button
                onClick={handleJoin}
                disabled={loading}
                variant="secondary"
                className="w-full border-2 border-amber-500 hover:border-amber-500 hover:bg-amber-500 hover:text-black text-amber-500"
              >
                {loading ? 'Подключение...' : session ? 'Запросить вход' : 'Войти через Google'}
              </Button>
            )}
          </RoomCard>
        </div>
      </div>

      {isPending && (
        <div className="fixed top-4 right-4 px-3 py-1 text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 uppercase">
          Проверка сессии...
        </div>
      )}
    </div>
  );
}
