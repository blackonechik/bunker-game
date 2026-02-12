'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from '@/shared/lib/auth-client';
import { useSocket } from '@/app/providers/socket-provider';
import { useSocketEvent } from '@/shared/hooks/use-socket';
import { PlayerDTO, RoomDTO, RoomState, ChatMessageDTO, ApocalypseDTO, LocationDTO } from '@/shared/types';
import { ChatPanel } from '@/widgets/chat-panel';
import { PlayerCard } from '@/widgets/player-list';
import { PlayerList } from '@/widgets/player-list';

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  
  const [code, setCode] = useState<string>('');
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [timer, setTimer] = useState(0);
  const [apocalypse, setApocalypse] = useState<ApocalypseDTO | null>(null);
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [apocalypseOptions, setApocalypseOptions] = useState<ApocalypseDTO[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationDTO[]>([]);
  const sessionUserId = session?.user?.id ?? null;
  const sessionPlayer = players.find(p => p.userId === sessionUserId) ?? null;
  const playerId = sessionPlayer?.id ?? 0;
  const currentPlayer = sessionPlayer;

  // Helper для добавления системных сообщений
  const addSystemMessage = useCallback((message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      message,
      type: 'system',
      createdAt: new Date(),
      roomId: room?.id || 0
    }]);
  }, [room?.id]);

  // Распаковка params
  useEffect(() => {
    params.then(p => setCode(p.code));
  }, [params]);

  // Загрузка данных
  useEffect(() => {
    if (!code) return;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        const data = await res.json();
        
        if (data.success) {
          setRoom(data.data.room);
          setPlayers(data.data.players);
          if (data.data.room.apocalypse) setApocalypse(data.data.room.apocalypse);
          if (data.data.room.location) setLocation(data.data.room.location);
        }
      } catch (err) {
        console.error('Error fetching room:', err);
      }
    };

    fetchRoom();
  }, [code]);

  // Socket события
  useSocketEvent<{ apocalypses: ApocalypseDTO[] }>('apocalypse:options', (data) => {
    setApocalypseOptions(data.apocalypses);
    addSystemMessage('Выберите тип апокалипсиса...');
  });

  useSocketEvent<{ locations: LocationDTO[] }>('location:options', (data) => {
    setLocationOptions(data.locations);
    addSystemMessage('Выберите локацию бункера...');
  });

  useSocketEvent<{ winnerId: number }>('voting:apocalypse:complete', (data) => {
    const winner = apocalypseOptions.find(a => a.id === data.winnerId);
    if (winner) {
      setApocalypse(winner);
      addSystemMessage(`Апокалипсис определен: ${winner.name}`);
    }
  });

  useSocketEvent<{ winnerId: number }>('voting:location:complete', (data) => {
    const winner = locationOptions.find(l => l.id === data.winnerId);
    if (winner) {
      setLocation(winner);
      addSystemMessage(`Локация определена: ${winner.name}`);
    }
  });

  useSocketEvent<{ round: number; state: RoomState }>('game:round_start', (data) => {
    setRoom(prev => prev ? { ...prev, currentRound: data.round, state: data.state } : null);
    setTimer(60);
    addSystemMessage(`Раунд ${data.round}: Обсуждение (60 сек)`);
  });

  useSocketEvent<{ playerId: number; cardId: number }>('card:revealed', (data) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === data.playerId) {
        return {
          ...p,
          cards: p.cards?.map(c => c.id === data.cardId ? { ...c, isRevealed: true } : c)
        };
      }
      return p;
    }));
    
    const playerName = players.find(p => p.id === data.playerId)?.name;
    addSystemMessage(`${playerName} раскрыл карту`);
  });

  useSocketEvent<{ playerId: number }>('player:eliminated', (data) => {
    const player = players.find(p => p.id === data.playerId);
    addSystemMessage(`${player?.name} был исключен из бункера`);
    
    setPlayers(prev => prev.map(p => 
      p.id === data.playerId ? { ...p, isAlive: false } : p
    ));
  });

  useSocketEvent<{ winners: PlayerDTO[] }>('game:ended', () => {
    addSystemMessage('Игра окончена! Выжившие определены.');
    setTimeout(() => {
      router.push('/');
    }, 5000);
  });

  // Таймер
  useEffect(() => {
    if (timer > 0 && room?.state === RoomState.DISCUSSION) {
      const interval = setInterval(() => {
        setTimer(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer, room?.state]);

  // Обработчики
  const handleSendMessage = (message: string) => {
    if (!currentPlayer) return;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      playerName: currentPlayer.name,
      message,
      type: 'user',
      createdAt: new Date(),
      roomId: room?.id || 0,
      playerId: currentPlayer.id
    }]);
  };

  const handleVoteApocalypse = (apocalypseId: number) => {
    if (!socket) return;

    socket.emit('vote:apocalypse', { apocalypseId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        addSystemMessage(`Ошибка: ${res.error}`);
      }
    });
  };

  const handleVoteLocation = (locationId: number) => {
    if (!socket) return;

    socket.emit('vote:location', { locationId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        addSystemMessage(`Ошибка: ${res.error}`);
      }
    });
  };

  const handleRevealCard = (cardId: number) => {
    if (!socket) return;

    socket.emit('card:reveal', { cardId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        addSystemMessage(`Ошибка: ${res.error}`);
      }
    });
  };

  const handleVotePlayer = (targetPlayerId: number) => {
    if (!socket) return;

    socket.emit('vote:player', { targetPlayerId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        addSystemMessage(`Ошибка: ${res.error}`);
      }
    });
  };

  // Рендер голосования за апокалипсис
  if (room?.state === RoomState.APOCALYPSE_VOTE && apocalypseOptions.length > 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black uppercase italic mb-8 text-center">
            Выберите Апокалипсис
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {apocalypseOptions.map((apoc) => (
              <motion.div
                key={apoc.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVoteApocalypse(apoc.id)}
                className="relative bg-zinc-900 border-4 border-red-900 p-8 cursor-pointer hover:border-red-500 transition-colors"
              >
                <h3 className="text-3xl font-black uppercase italic mb-4">{apoc.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 uppercase tracking-tight">
                  {apoc.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-red-900 text-red-400 text-[10px] border border-red-800 uppercase font-bold">
                    {apoc.hazardLevel}
                  </span>
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700 uppercase font-bold">
                    {apoc.duration}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Рендер голосования за локацию
  if (room?.state === RoomState.LOCATION_VOTE && locationOptions.length > 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black uppercase italic mb-8 text-center">
            Выберите Локацию
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {locationOptions.map((loc) => (
              <motion.div
                key={loc.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVoteLocation(loc.id)}
                className="relative bg-zinc-900 border-4 border-blue-900 p-8 cursor-pointer hover:border-blue-500 transition-colors"
              >
                <h3 className="text-3xl font-black uppercase italic mb-4">{loc.name}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs border-b border-zinc-800 pb-1">
                    <span className="text-zinc-500">ВМЕСТИМОСТЬ</span>
                    <span className="text-blue-400 font-bold">{loc.capacity} ЧЕЛОВЕК</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-zinc-800 pb-1">
                    <span className="text-zinc-500">РЕСУРСЫ</span>
                    <span className="text-blue-400 font-bold text-right">{loc.supplies.join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-zinc-800 pb-1">
                    <span className="text-zinc-500">СОСТОЯНИЕ</span>
                    <span className="text-blue-400 font-bold">{loc.condition}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Основной игровой экран
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <div className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* Верхняя панель */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-4 bg-zinc-900 p-4 border-l-8 border-amber-500 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 flex items-center justify-center border-4 ${timer > 10 ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500 animate-pulse'} font-black text-2xl`}>
              {timer}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                Раунд {room?.currentRound || 0}
              </div>
              <div className="text-lg font-black uppercase italic">
                {room?.state === RoomState.DISCUSSION ? 'Обсуждение' : 'Голосование'}
              </div>
            </div>
          </div>

          {apocalypse && location && (
            <div className="md:ml-auto flex gap-4 text-xs">
              <div className="px-3 py-1 bg-red-900 border border-red-800">
                {apocalypse.name}
              </div>
              <div className="px-3 py-1 bg-blue-900 border border-blue-800">
                {location.name} ({location.capacity} мест)
              </div>
            </div>
          )}
        </motion.div>

        {/* Основная сетка */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Список игроков */}
          <div className="lg:col-span-2 space-y-2">
            <PlayerList
              players={players}
              currentPlayerId={playerId}
              onVote={handleVotePlayer}
              canVote={room?.state === RoomState.VOTING}
            />
          </div>

          {/* Чат */}
          <div className="lg:col-span-2">
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
          </div>
        </div>

        {/* Карточки игрока */}
        {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <div className="text-xs font-black text-emerald-500 uppercase mb-4 tracking-[0.4em] flex items-center gap-2">
              <div className="h-px bg-emerald-500 flex-1"></div>
              Ваши Карты
              <div className="h-px bg-emerald-500 flex-1"></div>
            </div>

            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
              {currentPlayer.cards.map((card) => (
                <PlayerCard
                  key={card.id}
                  card={card}
                  onReveal={() => handleRevealCard(card.id)}
                  canReveal={room?.state === RoomState.DISCUSSION}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Статус подключения */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-900 border-2 border-red-500 text-red-400 font-bold uppercase text-xs"
          >
            ⚠ Подключение потеряно
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
