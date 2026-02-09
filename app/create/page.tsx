'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocketEmit } from '@/hooks/use-socket';

export default function CreatePage() {
  const router = useRouter();
  const { emit } = useSocketEmit();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [hardcore, setHardcore] = useState(false);
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
      const result = await emit<{ code: string; roomId: number; playerId: number; token: string }>('room:create', {
        maxPlayers,
        hardcore,
        playerName: playerName.trim(),
      });

      // Сохраняем токен
      localStorage.setItem('bunker_token', result.token);
      localStorage.setItem('bunker_player_id', result.playerId.toString());

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
      const result = await emit<{ roomId: number; playerId: number; token: string }>('room:join', {
        code: code.toUpperCase(),
        playerName: playerName.trim(),
      });

      // Сохраняем токен
      localStorage.setItem('bunker_token', result.token);
      localStorage.setItem('bunker_player_id', result.playerId.toString());

      // Переходим в лобби
      router.push(`/lobby/${code.toUpperCase()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа в комнату';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    
    const newCode = [...roomCode];
    newCode[index] = value.toUpperCase();
    setRoomCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600">
            Bunker
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Создать комнату */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-8 bg-zinc-900 border-2 ${mode === 'create' ? 'border-emerald-500' : 'border-zinc-800'} rounded-sm relative cursor-pointer`}
            onClick={() => setMode('create')}
          >
            <div className="absolute top-0 right-0 p-2 bg-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
              Initialize
            </div>

            <h2 className="text-2xl font-bold uppercase mb-8 flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${mode === 'create' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></span>
              Создать убежище
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-500 font-bold">Ваше имя</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onFocus={() => setMode('create')}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 focus:border-emerald-500 outline-none text-emerald-400 font-bold uppercase transition-colors"
                  placeholder="STALKER_01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-500 font-bold">
                  Игроков: {maxPlayers}
                </label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  onFocus={() => setMode('create')}
                  className="w-full accent-emerald-500 bg-zinc-800"
                />
              </div>

              {mode === 'create' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-black font-black uppercase tracking-tighter hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Создание...' : 'Сгенерировать код'}
                </motion.button>
              )}
            </div>
          </motion.div>
          

          {/* Войти в комнату */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-8 bg-zinc-900 border-2 ${mode === 'join' ? 'border-amber-500' : 'border-zinc-800'} rounded-sm relative cursor-pointer`}
            onClick={() => setMode('join')}
          >
            <h2 className="text-2xl font-bold uppercase mb-8 flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${mode === 'join' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`}></span>
              Войти по коду
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-500 font-bold">Ваше имя</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onFocus={() => setMode('join')}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 focus:border-amber-500 outline-none text-amber-400 font-bold uppercase transition-colors"
                  placeholder="SURVIVOR_92"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-500 font-bold">Код доступа</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      maxLength={1}
                      value={roomCode[index]}
                      onChange={(e) => handleCodeInput(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onFocus={() => setMode('join')}
                      className="w-full aspect-square bg-zinc-800 border-2 border-zinc-700 text-center text-3xl font-black text-amber-500 focus:border-amber-500 outline-none uppercase"
                    />
                  ))}
                </div>
              </div>

              {mode === 'join' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full py-4 border-2 border-amber-500 text-amber-500 font-black uppercase tracking-tighter hover:bg-amber-500 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Подключение...' : 'Запросить вход'}
                </motion.button>
              )}
            </div>
          </motion.div>
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

      {/* Фоновая текстура */}
      <div className="fixed inset-0 pointer-events-none opacity-20 contrast-150 mix-blend-overlay z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHptMC0xNS41YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6TTE4IDM0YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6bTAtMTUuNWMwLTIgMi00IDItNHMyIDIgMiA0YzAgMi0yIDQtMiA0cy0yLTItMi00eiIvPjwvZz48L2c+PC9zdmc+')]" />
    </div>
  );
}
