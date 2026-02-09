'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/providers/socket-provider';
import { useSocketEvent } from '@/hooks/use-socket';
import { PlayerDTO, RoomDTO, RoomState } from '@/lib/types';

export default function LobbyPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const playerId = typeof window !== 'undefined' ? localStorage.getItem('bunker_player_id') : null;
  const isHost = room?.players?.find(p => p.id.toString() === playerId)?.isHost;

  // Загрузка данных комнаты
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${params.code}`);
        const data = await res.json();
        
        if (data.success) {
          setRoom(data.data.room);
          setPlayers(data.data.players);
        } else {
          setError(data.error || 'Комната не найдена');
        }
      } catch (_err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (params.code) {
      fetchRoom();
    }
  }, [params.code]);

  // Подписка на обновления комнаты
  useSocketEvent<{ room: RoomDTO; players: PlayerDTO[] }>('room:update', (data) => {
    setRoom(data.room);
    setPlayers(data.players);
  });

  // Подписка на присоединение игрока
  useSocketEvent<{ player: PlayerDTO }>('player:joined', (data) => {
    setPlayers(prev => [...prev, data.player]);
  });

  // Подписка на старт игры
  useSocketEvent<{ state: RoomState }>('game:started', () => {
    router.push(`/game/${params.code}`);
  });

  const handleStartGame = () => {
    if (!socket || !isConnected) return;

    const token = localStorage.getItem('bunker_token');
    if (!token) return;

    socket.emit('game:start', { token }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Ошибка старта игры');
      }
    });
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${params.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(params.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-emerald-500 text-2xl font-bold uppercase animate-pulse">
          Загрузка...
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-red-500 text-2xl font-bold uppercase">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between border-b-2 border-zinc-800 pb-4 mb-8"
        >
          <div>
            <h2 className="text-4xl font-black uppercase italic">Staging Area</h2>
            <p className="text-zinc-500 uppercase text-xs mt-2">
              Awaiting survivors ({players.length}/{room?.maxPlayers})
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold tracking-widest hover:border-emerald-500 transition-colors"
            >
              {copied ? '✓ Скопировано' : `#${params.code}`}
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-amber-400 font-bold tracking-widest hover:border-amber-500 transition-colors text-xs"
            >
              {copied ? '✓' : 'Скопировать ссылку'}
            </button>
          </div>
        </motion.div>

        {/* Сетка игроков */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
        >
          {players.map((player, index) => {
            const isYou = player.id.toString() === playerId;
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-2 ${isYou ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'} flex flex-col items-center gap-2`}
              >
                <div className={`w-12 h-12 ${isYou ? 'bg-emerald-500' : 'bg-zinc-800'} rounded-full flex items-center justify-center text-${isYou ? 'black' : 'zinc-600'} font-bold border-2 ${isYou ? 'border-emerald-500' : 'border-zinc-700'}`}>
                  {isYou ? 'YOU' : player.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold uppercase truncate w-full text-center">
                  {player.name}
                </span>
                {player.isHost && (
                  <span className="text-[10px] text-amber-500 font-bold uppercase">HOST</span>
                )}
              </motion.div>
            );
          })}

          {/* Пустые слоты */}
          {Array.from({ length: (room?.maxPlayers || 0) - players.length }).map((_, index) => (
            <motion.div
              key={`empty-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (players.length + index) * 0.05 }}
              className="p-4 border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 border border-zinc-800 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-zinc-700 uppercase">Ожидание...</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Кнопка старта (только для хоста) */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              onClick={handleStartGame}
              disabled={players.length < 4 || !isConnected}
              className="px-12 py-4 bg-emerald-600 text-black font-black uppercase tracking-tighter hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              {players.length < 4 ? `Нужно минимум 4 игрока` : 'Начать игру'}
            </button>
          </motion.div>
        )}

        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-zinc-500 uppercase text-sm"
          >
            Ожидание старта игры от хоста...
          </motion.div>
        )}

        {/* Ошибка */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-900/20 border-2 border-red-500 text-red-400 text-center font-bold uppercase"
          >
            {error}
          </motion.div>
        )}

        {/* Статус подключения */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-900 border-2 border-red-500 text-red-400 font-bold uppercase text-xs"
          >
            ⚠ Подключение потеряно
          </motion.div>
        )}
      </div>

      {/* Фоновая текстура */}
      <div className="fixed inset-0 pointer-events-none opacity-20 contrast-150 mix-blend-overlay z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHptMC0xNS41YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6TTE4IDM0YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6bTAtMTUuNWMwLTIgMi00IDItNHMyIDIgMiA0YzAgMi0yIDQtMiA0cy0yLTItMi00eiIvPjwvZz48L2c+PC9zdmc+')]" />
    </div>
  );
}
