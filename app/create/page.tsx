'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocketEmit } from '@/shared/hooks/use-socket';
import { Button, Logo, RoomCard, TextInput, RangeSlider, CodeInput } from '@/src/shared/ui';
import { useAuthStore } from '@/src/shared/store';
import type { RoomCreateResponse, RoomJoinResponse } from '@/src/shared/types';

export default function CreatePage() {
  const router = useRouter();
  const { emit } = useSocketEmit();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [roomCode, setRoomCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError('Введите имя');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await emit<RoomCreateResponse>('room:create', {
        maxPlayers,
        hardcore: false,
        playerName: playerName.trim(),
      });

      setAuth(result.token, result.playerId);

      // Переходим в лобби
      router.push(`/lobby/${result.code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания комнаты';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = roomCode.join('');
    
    if (!playerName.trim()) {
      setError('Введите имя');
      return;
    }

    if (code.length !== 4) {
      setError('Введите код комнаты');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await emit<RoomJoinResponse>('room:join', {
        code: code.toUpperCase(),
        playerName: playerName.trim(),
      });

      setAuth(result.token, result.playerId);

      // Переходим в лобби
      router.push(`/lobby/${code.toUpperCase()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа в комнату';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4 items-center">
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Создать комнату */}
          <RoomCard mode="create" isActive={mode === 'create'} onFocus={() => setMode('create')} delay={0.2}>
            <TextInput
              label="Ваше имя"
              variant="emerald"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onFocus={() => setMode('create')}
              maxLength={20}
              placeholder="STALKER_01"
            />

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
                {loading ? 'Создание...' : 'Сгенерировать код'}
              </Button>
            )}
          </RoomCard>
          

          {/* Присоединиться к убежищу */}
          <RoomCard mode="join" isActive={mode === 'join'} onFocus={() => setMode('join')} delay={0.3}>
            <TextInput
              label="Ваше имя"
              variant="amber"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onFocus={() => setMode('join')}
              maxLength={20}
              placeholder="SURVIVOR_92"
            />

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
                {loading ? 'Подключение...' : 'Запросить вход'}
              </Button>
            )}
          </RoomCard>
        </div>

        {/* Ошибка */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-4xl mx-auto p-4 bg-red-900/20 border-2 border-red-500 text-red-400 text-center font-bold uppercase"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
