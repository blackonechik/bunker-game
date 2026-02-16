'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from '@/shared/lib/auth-client';
import { useSocket } from '@/app/providers/socket-provider';
import { useSocketEvent, useSocketEmit } from '@/shared/hooks/use-socket';
import { PlayerDTO, RoomDTO, RoomState, RoomJoinResponse } from '@/shared/types';
import { lobbyApi } from '@/src/features/room-management';
import { LobbyHeader } from '@/src/widgets/lobby-header';
import { LobbyPlayers } from '@/src/widgets/lobby-players';
import { LobbyControls } from '@/src/widgets/lobby-controls';
import { NameModal, showNotification } from '@/shared/ui';

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { emit } = useSocketEmit();
  const { data: session, isPending } = useSession();
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [telegramMiniAppStatus, setTelegramMiniAppStatus] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const resumeAttemptedRef = useRef(false);

  const sessionUserId = session?.user?.id ?? null;
  const playerName = session?.user?.name?.trim() ?? '';
  const currentPlayer = players.find((player) => player.userId === sessionUserId) ?? null;
  const currentPlayerId = currentPlayer?.id ?? null;
  const isHost = currentPlayer?.isHost ?? false;

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setTelegramMiniAppStatus('no');
      return;
    }

    let attempts = 0;
    const maxAttempts = 40;

    const detectMiniApp = () => {
      const webApp = window.Telegram?.WebApp;
      const hasMiniAppContext = Boolean(webApp?.initData || webApp?.initDataUnsafe?.start_param);

      if (hasMiniAppContext) {
        setTelegramMiniAppStatus('yes');
        return true;
      }

      return false;
    };

    if (detectMiniApp()) {
      return;
    }

    const interval = window.setInterval(() => {
      attempts += 1;

      if (detectMiniApp() || attempts >= maxAttempts) {
        setTelegramMiniAppStatus((prev) => (prev === 'yes' ? 'yes' : 'no'));
        window.clearInterval(interval);
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      resumeAttemptedRef.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!code || isPending || !isConnected) return;

    if (!session) {
      if (telegramMiniAppStatus !== 'no') {
        return;
      }

      signIn.social({ provider: 'google', callbackURL: `/lobby/${code}` });
      return;
    }

    if (!playerName) {
      setShowNameModal(true);
      return;
    }

    if (resumeAttemptedRef.current || joiningRoom) return;
    resumeAttemptedRef.current = true;

    let cancelled = false;

    const connectToRoom = async () => {
      setJoiningRoom(true);

      try {
        await emit('player:resume', { code });
      } catch {
        try {
          await emit<RoomJoinResponse>('room:join', {
            code,
            playerName,
          });
        } catch (err: unknown) {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : 'Ошибка присоединения к комнате';
          showNotification.error('Ошибка', message);
        }
      }

      try {
        const response = await lobbyApi.getRoom(code);
        if (!cancelled && response.success && response.data) {
          setRoom(response.data.room);
          setPlayers(response.data.players);
        }
      } catch {
        // ignore sync errors, socket updates will still arrive
      } finally {
        if (!cancelled) {
          setShowNameModal(false);
          setJoiningRoom(false);
        }
      }
    };

    connectToRoom();

    return () => {
      cancelled = true;
    };
  }, [code, emit, isConnected, isPending, joiningRoom, playerName, session, telegramMiniAppStatus]);

  useEffect(() => {
    if (!isConnected || !sessionUserId) return;

    setPlayers((prev) =>
      prev.map((player) =>
        player.userId === sessionUserId ? { ...player, isOnline: true } : player
      )
    );
  }, [isConnected, sessionUserId]);

  useEffect(() => {
    if (!code) return;

    const fetchRoom = async () => {
      const response = await lobbyApi.getRoom(code);

      if (response.success && response.data) {
        setRoom(response.data.room);
        setPlayers(response.data.players);
      } else {
        setError(response.error || 'Комната не найдена');
      }

      setLoading(false);
    };

    fetchRoom();
  }, [code]);

  useSocketEvent<{ room: RoomDTO; players: PlayerDTO[] }>('room:update', (data) => {
    setRoom(data.room);
    setPlayers(data.players);
  });

  useSocketEvent<{ player: PlayerDTO }>('player:joined', (data) => {
    setPlayers((prev) => {
      if (prev.some((player) => player.id === data.player.id)) {
        return prev;
      }
      return [...prev, data.player];
    });
  });

  useSocketEvent<{ playerId: number }>('player:offline', (data) => {
    setPlayers((prev) => prev.map((player) => (player.id === data.playerId ? { ...player, isOnline: false } : player)));
  });

  useSocketEvent<{ playerId: number }>('player:online', (data) => {
    setPlayers((prev) => prev.map((player) => (player.id === data.playerId ? { ...player, isOnline: true } : player)));
  });

  useSocketEvent<{ playerId: number }>('player:removed', (data) => {
    setPlayers((prev) => prev.filter((player) => player.id !== data.playerId));
  });

  useSocketEvent<{ message: string }>('player:kicked', (data) => {
    showNotification.error('Удалены из комнаты', data.message);
    router.push('/');
  });

  useSocketEvent<{ state: RoomState }>('game:started', () => {
    router.push(`/game/${code}`);
  });

  const handleNameSubmit = async (name: string) => {
    if (!code) {
      showNotification.error('Ошибка', 'Код комнаты не найден');
      return;
    }

    if (!isConnected) {
      showNotification.error('Ошибка подключения', 'Сокет еще не подключен, повторите через секунду');
      return;
    }

    setJoiningRoom(true);

    try {
      if (!session) {
        await signIn.social({ provider: 'google', callbackURL: `/lobby/${code}` });
        return;
      }

      await emit<RoomJoinResponse>('room:join', {
        code,
        playerName: name.trim(),
      });

      await emit('player:resume', { code });

      showNotification.success('Успешно', 'Вы присоединились к комнате!');

      const response = await lobbyApi.getRoom(code);
      if (response.success && response.data) {
        setRoom(response.data.room);
        setPlayers(response.data.players);
      }

      setShowNameModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка присоединения к комнате';
      showNotification.error('Ошибка', message);
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleKickPlayer = async (targetPlayerId: number) => {
    try {
      await emit('player:kick', { targetPlayerId });
      showNotification.success('Успешно', 'Игрок удален из комнаты');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления игрока';
      showNotification.error('Ошибка', message);
    }
  };

  const handleStartGame = () => {
    if (!socket || !isConnected) return;

    socket.emit('game:start', {}, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Ошибка старта игры');
      }
    });
  };

  const handleFillBots = async () => {
    try {
      const result = await emit<{ addedBots: number }>('room:fill-bots', {});
      if (result.addedBots > 0) {
        showNotification.success('Боты добавлены', `Добавлено ботов: ${result.addedBots}`);
      } else {
        showNotification.success('Комната заполнена', 'Свободных слотов для ботов нет');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка добавления ботов';
      showNotification.error('Ошибка', message.includes('не ответил') ? `${message} Если проблема повторяется, перезапустите dev-сервер.` : message);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-950 flex items-center justify-center">
        <div className="text-emerald-500 text-2xl font-bold uppercase animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="bg-zinc-950 flex items-center justify-center">
        <div className="text-red-500 text-2xl font-bold uppercase">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-zinc-950 text-zinc-200 font-mono">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LobbyHeader
            code={code}
            currentPlayers={players.length}
            maxPlayers={room?.maxPlayers || 0}
            isHost={isHost}
            currentUserName={session?.user?.name ?? null}
            currentUserImage={session?.user?.image ?? null}
          />

          <LobbyPlayers
            players={players}
            maxPlayers={room?.maxPlayers || 0}
            currentPlayerId={currentPlayerId?.toString() || null}
            isHost={isHost}
            onKickPlayer={handleKickPlayer}
          />

          <LobbyControls
            isHost={isHost}
            playersCount={players.length}
            maxPlayers={room?.maxPlayers || 0}
            minPlayers={4}
            isConnected={isConnected}
            onStartGame={handleStartGame}
            onFillBots={handleFillBots}
            error={error}
          />

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

        <div className="fixed inset-0 pointer-events-none opacity-20 contrast-150 mix-blend-overlay z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHptMC0xNS41YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6TTE4IDM0YzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6bTAtMTUuNWMwLTIgMi00IDItNHMyIDIgMiA0YzAgMi0yIDQtMiA0cy0yLTItMi00eiIvPjwvZz48L2c+PC9zdmc+') ]" />
      </div>

      <NameModal
        isOpen={showNameModal}
        onSubmit={handleNameSubmit}
        isLoading={joiningRoom}
        title="Добро пожаловать в бункер"
        description="Представьтесь, чтобы присоединиться"
      />
    </>
  );
}
