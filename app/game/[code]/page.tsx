'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from '@/shared/lib/auth-client';
import { useSocket } from '@/app/providers/socket-provider';
import { useSocketEvent, useSocketEmit } from '@/shared/hooks/use-socket';
import { PlayerDTO, RoomDTO, RoomState, ChatMessageDTO, ApocalypseDTO, LocationDTO } from '@/shared/types';
import { GameTopBar, SystemLogPanel, PlayersGrid, MyCardsHud, VictoryScreen, VoteSelectionScreen } from '@/widgets/game-board';

interface RoundStartPayload {
  round: number;
  state: RoomState;
  duration?: number;
  endsAt?: number;
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { isConnected } = useSocket();
  const { emit } = useSocketEmit();
  const { data: session } = useSession();

  const [code, setCode] = useState<string>('');
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [timer, setTimer] = useState(60);
  const [selfPlayerId, setSelfPlayerId] = useState<number | null>(null);
  const [apocalypse, setApocalypse] = useState<ApocalypseDTO | null>(null);
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [apocalypseOptions, setApocalypseOptions] = useState<ApocalypseDTO[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationDTO[]>([]);
  const [winners, setWinners] = useState<PlayerDTO[]>([]);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  const resumeAttemptedRef = useRef(false);
  const systemMessageKeysRef = useRef<Set<string>>(new Set());
  const sessionUserId = session?.user?.id ?? null;
  const currentPlayer =
    players.find((player) => player.id === selfPlayerId) ??
    players.find((player) => player.userId === sessionUserId) ??
    null;
  const currentPlayerId = currentPlayer?.id;
  const currentRound = room?.currentRound || 1;
  const gameStartedAtMs = room?.startedAt ? new Date(room.startedAt).getTime() : null;
  const gameDurationSeconds = gameStartedAtMs ? Math.max(0, Math.floor((nowTimestamp - gameStartedAtMs) / 1000)) : 0;
  const alivePlayersCount = players.filter((player) => player.isAlive).length;

  const hasRevealedThisRound =
    currentPlayer?.cards?.some((card) => card.revealedRound === currentRound) || false;

  const addSystemMessage = useCallback((message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message,
        type: 'system',
        createdAt: new Date(),
      },
    ]);
  }, []);

  const addSystemMessageOnce = useCallback((key: string, message: string) => {
    if (systemMessageKeysRef.current.has(key)) {
      return;
    }

    systemMessageKeysRef.current.add(key);
    addSystemMessage(message);
  }, [addSystemMessage]);

  const toMilliseconds = useCallback((timestamp: number) => {
    return timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  }, []);

  useEffect(() => {
    params.then((resolvedParams) => setCode(resolvedParams.code.toUpperCase()));
  }, [params]);

  useEffect(() => {
    if (!isConnected) {
      resumeAttemptedRef.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!code) return;

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${code}`);
        const data = await response.json();

        if (!data.success) return;

        setRoom(data.data.room);
        setPlayers(data.data.players);

        if (data.data.room.apocalypse) {
          setApocalypse(data.data.room.apocalypse);
        }

        if (data.data.room.location) {
          setLocation(data.data.room.location);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      }
    };

    fetchRoom();
  }, [code]);

  useEffect(() => {
    if (!code || !isConnected || !session?.user?.id || resumeAttemptedRef.current) {
      return;
    }

    resumeAttemptedRef.current = true;
    let cancelled = false;

    const resumePlayer = async () => {
      try {
        const data = await emit<{ room: RoomDTO; players: PlayerDTO[]; playerId: number }>('player:resume', { code });
        if (cancelled) return;

        setRoom(data.room);
        setPlayers(data.players);
        setSelfPlayerId(data.playerId);
      } catch {
        if (!cancelled) {
          resumeAttemptedRef.current = false;
        }
      }
    };

    resumePlayer();

    return () => {
      cancelled = true;
    };
  }, [code, emit, isConnected, session?.user?.id]);

  useSocketEvent<{ room: RoomDTO; players: PlayerDTO[] }>('room:update', (data) => {
    setRoom(data.room);
    setPlayers(data.players);

    if (!selfPlayerId && sessionUserId) {
      const matchedPlayer = data.players.find((player) => player.userId === sessionUserId);
      if (matchedPlayer) {
        setSelfPlayerId(matchedPlayer.id);
      }
    }

    if (data.room.apocalypse) {
      setApocalypse(data.room.apocalypse);
    }

    if (data.room.location) {
      setLocation(data.room.location);
    }
  });

  useSocketEvent<{ state: RoomState }>('game:started', (data) => {
    setRoom((prev) => (prev ? { ...prev, state: data.state } : prev));
    addSystemMessageOnce('game-started', 'Игра началась. Голосование за апокалипсис...');
  });

  useSocketEvent<{ apocalypses: ApocalypseDTO[] }>('apocalypse:options', (data) => {
    setRoom((prev) => (prev ? { ...prev, state: RoomState.APOCALYPSE_VOTE } : prev));
    setApocalypseOptions(data.apocalypses);
    const optionsKey = data.apocalypses.map((item) => item.id).sort((a, b) => a - b).join('-');
    addSystemMessageOnce(`apocalypse-options:${optionsKey}`, 'Выберите тип апокалипсиса...');
  });

  useSocketEvent<{ locations: LocationDTO[] }>('location:options', (data) => {
    setRoom((prev) => (prev ? { ...prev, state: RoomState.LOCATION_VOTE } : prev));
    setLocationOptions(data.locations);
    const optionsKey = data.locations.map((item) => item.id).sort((a, b) => a - b).join('-');
    addSystemMessageOnce(`location-options:${optionsKey}`, 'Выберите локацию бункера...');
  });

  useSocketEvent<{ winnerId: number }>('voting:apocalypse:complete', (data) => {
    const winner = apocalypseOptions.find((option) => option.id === data.winnerId);
    if (winner) {
      setApocalypse(winner);
      addSystemMessageOnce(`apocalypse-winner:${data.winnerId}`, `Апокалипсис определен: ${winner.name}`);
    }

    setApocalypseOptions([]);
  });

  useSocketEvent<{ winnerId: number }>('voting:location:complete', (data) => {
    const winner = locationOptions.find((option) => option.id === data.winnerId);
    if (winner) {
      setLocation(winner);
      addSystemMessageOnce(`location-winner:${data.winnerId}`, `Локация определена: ${winner.name}`);
    }

    setLocationOptions([]);
  });

  useSocketEvent<RoundStartPayload>('game:round_start', (data) => {
    setRoom((prev) =>
      prev
        ? {
          ...prev,
          currentRound: data.round,
          state: data.state,
          roundTimer: typeof data.endsAt === 'number' ? data.endsAt : prev.roundTimer,
        }
        : prev
    );

    const endsAtMs = typeof data.endsAt === 'number' ? toMilliseconds(data.endsAt) : null;
    setTimer(
      typeof endsAtMs === 'number'
        ? Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000))
        : (data.duration ?? 60)
    );
    addSystemMessageOnce(`round-start:${data.round}`, `Раунд ${data.round}: обсуждение (60 сек)`);
  });

  useSocketEvent<{ round: number; state: RoomState; remainingSeconds: number; endsAt?: number }>('game:timer_sync', (data) => {
    setRoom((prev) =>
      prev
        ? {
          ...prev,
          currentRound: data.round,
          state: data.state,
          roundTimer: data.endsAt ?? prev.roundTimer,
        }
        : prev
    );
    setTimer(Math.max(0, data.remainingSeconds));
  });

  useSocketEvent<{ round: number; state: RoomState }>('game:phase_changed', (data) => {
    setRoom((prev) => (prev ? { ...prev, state: data.state } : prev));

    if (data.state === RoomState.CARD_REVEAL) {
      addSystemMessageOnce(`phase:${data.round}:CARD_REVEAL`, `Раунд ${data.round}: открытие карт`);
    }

    if (data.state === RoomState.VOTING) {
      addSystemMessageOnce(`phase:${data.round}:VOTING`, `Раунд ${data.round}: голосование за исключение`);
    }
  });

  useSocketEvent<{ playerId: number; cardId: number }>('card:revealed', (data) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== data.playerId) {
          return player;
        }

        return {
          ...player,
          cards: player.cards?.map((card) =>
            card.id === data.cardId ? { ...card, isRevealed: true, revealedRound: currentRound } : card
          ),
        };
      })
    );

    const playerName = players.find((player) => player.id === data.playerId)?.name;
    addSystemMessage(`${playerName || 'Игрок'} раскрыл карту`);
  });

  useSocketEvent<{ playerId: number }>('player:eliminated', (data) => {
    const player = players.find((playerItem) => playerItem.id === data.playerId);
    addSystemMessage(`${player?.name || 'Игрок'} был исключен из бункера`);

    setPlayers((prev) =>
      prev.map((playerItem) =>
        playerItem.id === data.playerId ? { ...playerItem, isAlive: false } : playerItem
      )
    );
  });

  useSocketEvent<{ winners: PlayerDTO[] }>('game:ended', (data) => {
    addSystemMessage('Игра окончена: в бункере осталось 2 выживших.');
    setWinners(data.winners || []);
    setRoom((prev) => (prev ? { ...prev, state: RoomState.FINISHED } : prev));
  });

  useEffect(() => {
    if (room?.state !== RoomState.DISCUSSION) {
      return;
    }

    if (typeof room.roundTimer !== 'number') {
      return;
    }

    const roundTimerMs = toMilliseconds(room.roundTimer);

    const syncTimer = () => {
      setTimer(Math.max(0, Math.ceil((roundTimerMs - Date.now()) / 1000)));
    };

    syncTimer();
    const intervalId = setInterval(syncTimer, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [room?.state, room?.roundTimer, toMilliseconds]);

  const handleSendMessage = (message: string) => {
    if (!currentPlayer) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        playerName: currentPlayer.name,
        message,
        type: 'user',
        createdAt: new Date(),
        playerId: currentPlayer.id,
      },
    ]);
  };

  const emitWithResumeRetry = async <TData,>(event: string, data: TData) => {
    try {
      await emit(event, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Игрок не подключен к комнате') && code) {
        try {
          await emit('player:resume', { code });
          await emit(event, data);
          return;
        } catch (retryError) {
          const retryMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
          addSystemMessage(`Ошибка: ${retryMessage}`);
          return;
        }
      }

      addSystemMessage(`Ошибка: ${errorMessage}`);
    }
  };

  const handleVoteApocalypse = async (apocalypseId: number) => {
    await emitWithResumeRetry('vote:apocalypse', { apocalypseId });
  };

  const handleVoteLocation = async (locationId: number) => {
    await emitWithResumeRetry('vote:location', { locationId });
  };

  const handleRevealCard = async (cardId: number) => {
    await emitWithResumeRetry('card:reveal', { cardId });
  };

  const handleVotePlayer = async (targetPlayerId: number) => {
    await emitWithResumeRetry('vote:player', { targetPlayerId });
  };

  if (room?.state === RoomState.APOCALYPSE_VOTE && apocalypseOptions.length > 0) {
    return (
      <VoteSelectionScreen
        title="Аппокалипсис"
        options={apocalypseOptions}
        onSelect={handleVoteApocalypse}
        mode="apocalypse"
      />
    );
  }

  if (room?.state === RoomState.LOCATION_VOTE && locationOptions.length > 0) {
    return (
      <VoteSelectionScreen
        title="Локацию"
        options={locationOptions}
        onSelect={handleVoteLocation}
        mode="location"
      />
    );
  }

  if (room?.state === RoomState.FINISHED) {
    const finalWinners = winners.length > 0 ? winners : players.filter((player) => player.isAlive);
    return <VictoryScreen winners={finalWinners} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,0)_0%,rgba(9,9,11,1)_100%)] z-10" />

      <GameTopBar
        round={room?.currentRound || 1}
        state={room?.state}
        timer={timer}
        apocalypseName={apocalypse?.name}
        locationName={location?.name}
        gameDurationSeconds={gameDurationSeconds}
        alivePlayersCount={alivePlayersCount}
        totalPlayersCount={players.length}
      />

      <main className="relative z-20 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 flex flex-col gap-4">
          {currentPlayer && (
            <MyCardsHud
              playerName={currentPlayer.name}
              cards={currentPlayer.cards || []}
              canReveal={room?.state === RoomState.CARD_REVEAL}
              hasRevealedThisRound={hasRevealedThisRound}
              onReveal={handleRevealCard}
            />
          )}
          <SystemLogPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>

        <div className="lg:col-span-9">
          <PlayersGrid
            players={players}
            currentPlayerId={currentPlayerId}
            canVote={room?.state === RoomState.VOTING}
            onVote={handleVotePlayer}
          />
        </div>
      </main>

      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-900 border-2 border-red-500 text-red-400 font-bold uppercase text-xs z-50"
          >
            ⚠ Подключение потеряно
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
