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

interface EliminatedVoteResultPayload {
  targetId: string | number;
  count: string | number;
}

interface EliminationAnnouncement {
  playerName: string;
  votes: Array<{
    targetId: number;
    targetName: string;
    count: number;
  }>;
}

type ActiveScreen = 'vote-apocalypse' | 'vote-location' | 'intro' | 'elimination' | 'board' | 'victory';

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
  const [showIntroNarrative, setShowIntroNarrative] = useState(false);
  const [eliminationAnnouncement, setEliminationAnnouncement] = useState<EliminationAnnouncement | null>(null);

  const resumeAttemptedRef = useRef(false);
  const systemMessageKeysRef = useRef<Set<string>>(new Set());
  const introShownRef = useRef(false);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introRafRef = useRef<number | null>(null);
  const eliminationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    return () => {
      if (introRafRef.current !== null) {
        cancelAnimationFrame(introRafRef.current);
      }

      if (introTimeoutRef.current) {
        clearTimeout(introTimeoutRef.current);
      }

      if (eliminationTimeoutRef.current) {
        clearTimeout(eliminationTimeoutRef.current);
      }
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

  useEffect(() => {
    if (introShownRef.current) {
      return;
    }

    if (!room?.state || !apocalypse || !location) {
      return;
    }

    const shouldShowIntro =
      room.state !== RoomState.WAITING &&
      room.state !== RoomState.APOCALYPSE_VOTE &&
      room.state !== RoomState.LOCATION_VOTE &&
      room.state !== RoomState.FINISHED;

    if (!shouldShowIntro) {
      return;
    }

    introShownRef.current = true;
    introRafRef.current = requestAnimationFrame(() => {
      setShowIntroNarrative(true);
      introRafRef.current = null;
    });

    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
    }

    introTimeoutRef.current = setTimeout(() => {
      setShowIntroNarrative(false);
      introTimeoutRef.current = null;
    }, 6500);
  }, [room?.state, apocalypse, location]);

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

  useSocketEvent<{ playerId: number; votes?: EliminatedVoteResultPayload[] }>('player:eliminated', (data) => {
    const player = players.find((playerItem) => playerItem.id === data.playerId);
    addSystemMessage(`${player?.name || 'Игрок'} был исключен из бункера`);

    const votes = (data.votes || []).map((vote) => {
      const targetId = Number(vote.targetId);
      const count = Number(vote.count);
      const target = players.find((playerItem) => playerItem.id === targetId);

      return {
        targetId,
        targetName: target?.name || `Игрок #${targetId}`,
        count: Number.isFinite(count) ? count : 0,
      };
    });

    setEliminationAnnouncement({
      playerName: player?.name || 'Игрок',
      votes,
    });

    if (eliminationTimeoutRef.current) {
      clearTimeout(eliminationTimeoutRef.current);
    }

    eliminationTimeoutRef.current = setTimeout(() => {
      setEliminationAnnouncement(null);
      eliminationTimeoutRef.current = null;
    }, 5000);

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

  const renderVoteLoader = (title: string) => (
    <div className="bg-zinc-950 text-zinc-300 font-mono flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center border border-zinc-800 bg-black/50 px-8 py-10"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-3">ПОДГОТОВКА ЭТАПА</p>
        <h2 className="text-xl font-black uppercase text-zinc-200">Голосование за {title}</h2>
        <p className="text-sm text-zinc-500 mt-2">Получаем варианты, подождите...</p>
      </motion.div>
    </div>
  );

  const activeScreen: ActiveScreen = (() => {
    if (eliminationAnnouncement) return 'elimination';
    if (room?.state === RoomState.FINISHED) return 'victory';
    if (room?.state === RoomState.APOCALYPSE_VOTE) return 'vote-apocalypse';
    if (room?.state === RoomState.LOCATION_VOTE) return 'vote-location';
    if (showIntroNarrative) return 'intro';
    return 'board';
  })();

  const finalWinners = winners.length > 0 ? winners : players.filter((player) => player.isAlive);

  return (
    <div className="bg-zinc-950 text-zinc-300 font-mono overflow-x-hidden relative">
      <AnimatePresence mode="wait" initial={false}>
        {activeScreen === 'vote-apocalypse' && (
          <motion.div
            key="vote-apocalypse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {apocalypseOptions.length > 0 ? (
              <VoteSelectionScreen
                title="Апокалипсис"
                options={apocalypseOptions}
                onSelect={handleVoteApocalypse}
                mode="apocalypse"
              />
            ) : (
              renderVoteLoader('апокалипсис')
            )}
          </motion.div>
        )}

        {activeScreen === 'vote-location' && (
          <motion.div
            key="vote-location"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {locationOptions.length > 0 ? (
              <VoteSelectionScreen
                title="Локацию"
                options={locationOptions}
                onSelect={handleVoteLocation}
                mode="location"
              />
            ) : (
              renderVoteLoader('локацию')
            )}
          </motion.div>
        )}

        {activeScreen === 'intro' && (
          <motion.section
            key="intro-narrative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center px-6 h-full relative z-10 py-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="max-w-3xl text-center space-y-6"
            >
              <p className="text-xs tracking-[0.28em] uppercase text-zinc-600">Протокол начала катастрофы</p>
              <p className="text-4xl max-md:text-2xl font-black uppercase text-red-500">На мир спустилось: {apocalypse?.name}</p>
              <p className="text-2xl max-md:text-lg text-zinc-200 leading-relaxed">
                <span className="text-amber-400 font-black">{Math.max(players.length, 0)}</span> — число игроков, которые оказались запертыми в
                {' '}<span className="text-blue-400 font-black">{location?.name}</span>.
              </p>
              <p className="text-xl max-md:text-base uppercase tracking-wider text-zinc-400">Но в финале останутся только двое игроков...</p>
            </motion.div>
          </motion.section>
        )}

        {activeScreen === 'elimination' && eliminationAnnouncement && (
          <motion.section
            key="elimination-announcement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center px-6 relative h-full flex-col gap-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="max-w-4xl text-center"
            >
              <p className="text-xs tracking-[0.28em] uppercase text-zinc-600 mb-4">Протокол голосования завершен</p>
              <p className="text-4xl max-md:text-2xl font-black uppercase text-red-500">{eliminationAnnouncement.playerName} был исключен</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="w-full max-w-3xl px-6"
            >
              <div className="border border-zinc-800 bg-zinc-950/90 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-3">Итоги голосования</p>
                <div className="grid gap-2">
                  {eliminationAnnouncement.votes.map((vote) => (
                    <div key={vote.targetId} className="flex items-center justify-between text-sm text-zinc-300">
                      <span>{vote.targetName}</span>
                      <span className="text-zinc-100 font-bold">{vote.count} голос(ов)</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}

        {activeScreen === 'board' && (
          <motion.div
            key="game-board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
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

            <main className="relative z-20 py-6 grid grid-cols-12 max-lg:grid-cols-1 gap-4">
              <div className="col-span-3 max-lg:col-span-1 flex flex-col gap-4">
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

              <div className="col-span-9 max-lg:col-span-1">
                <PlayersGrid
                  players={players}
                  currentPlayerId={currentPlayerId}
                  canVote={room?.state === RoomState.VOTING}
                  onVote={handleVotePlayer}
                />
              </div>
            </main>
          </motion.div>
        )}

        {activeScreen === 'victory' && (
          <motion.div
            key="victory-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <VictoryScreen winners={finalWinners} />
          </motion.div>
        )}
      </AnimatePresence>

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
