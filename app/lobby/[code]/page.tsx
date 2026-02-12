'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/app/providers/socket-provider';
import { useSocketEvent, useSocketEmit } from '@/shared/hooks/use-socket';
import { PlayerDTO, RoomDTO, RoomState, RoomJoinResponse } from '@/shared/types';
import { useAuthStore } from '@/src/shared/store';
import { lobbyApi } from '@/src/features/room-management';
import { LobbyHeader } from '@/src/widgets/lobby-header';
import { LobbyPlayers } from '@/src/widgets/lobby-players';
import { LobbyControls } from '@/src/widgets/lobby-controls';
import { NameModal, showNotification } from '@/shared/ui';

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
	const router = useRouter();
	const { socket, isConnected } = useSocket();
	const { emit } = useSocketEmit();
	const { playerId, playerName, token, _hasHydrated, setAuth } = useAuthStore();
	const [room, setRoom] = useState<RoomDTO | null>(null);
	const [players, setPlayers] = useState<PlayerDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState<string>('');
	const [error, setError] = useState('');
	const [showNameModal, setShowNameModal] = useState(false);
	const [joiningRoom, setJoiningRoom] = useState(false);

	const isHost = room?.players?.find((p) => p.id === playerId)?.isHost;

	// Распаковка params
	useEffect(() => {
		params.then((p) => setCode(p.code));
	}, [params]);

	// Проверка наличия имени после гидратации
	useEffect(() => {
		if (!_hasHydrated) return;

		// Если нет токена и нет имени - показываем модальное окно
		if (!token && !playerName) {
			const timer = setTimeout(() => {
				setShowNameModal(true);
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [_hasHydrated, token, playerName]);

	// Загрузка данных комнаты
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

	// Подписка на обновления комнаты
	useSocketEvent<{ room: RoomDTO; players: PlayerDTO[] }>('room:update', (data) => {
		setRoom(data.room);
		setPlayers(data.players);
	});

	// Подписка на присоединение игрока
	useSocketEvent<{ player: PlayerDTO }>('player:joined', (data) => {
		setPlayers((prev) => [...prev, data.player]);
	});

	// Подписка на отключение игрока
	useSocketEvent<{ playerId: number }>('player:offline', (data) => {
		setPlayers((prev) => prev.map((p) => (p.id === data.playerId ? { ...p, isOnline: false } : p)));
	});

	// Подписка на удаление игрока
	useSocketEvent<{ playerId: number }>('player:removed', (data) => {
		setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
	});

	// Подписка на kicked (когда вас удалили)
	useSocketEvent<{ message: string }>('player:kicked', (data) => {
		showNotification.error('Удалены из комнаты', data.message);
		router.push('/');
	});

	// Подписка на старт игры
	useSocketEvent<{ state: RoomState }>('game:started', () => {
		router.push(`/game/${code}`);
	});

	const handleNameSubmit = async (name: string) => {
		if (!code) {
			showNotification.error('Ошибка', 'Код комнаты не найден');
			return;
		}

		setJoiningRoom(true);

		try {
			const result = await emit<RoomJoinResponse>('room:join', {
				code: code.toUpperCase(),
				playerName: name.trim(),
			});

			setAuth(result.token, result.playerId, name.trim());
			setShowNameModal(false);

			showNotification.success('Успешно', 'Вы присоединились к комнате!');

			// Перезагрузим данные комнаты
			const response = await lobbyApi.getRoom(code);
			if (response.success && response.data) {
				setRoom(response.data.room);
				setPlayers(response.data.players);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Ошибка присоединения к комнате';
			showNotification.error('Ошибка', message);
		} finally {
			setJoiningRoom(false);
		}
	};

	const handleKickPlayer = async (targetPlayerId: number) => {
		if (!token) {
			showNotification.error('Ошибка', 'Нет доступа');
			return;
		}

		try {
			await emit('player:kick', { token, targetPlayerId });
			showNotification.success('Успешно', 'Игрок удален из комнаты');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Ошибка удаления игрока';
			showNotification.error('Ошибка', message);
		}
	};

	const handleStartGame = () => {
		if (!socket || !isConnected || !token) return;

		socket.emit('game:start', { token }, (response: { success: boolean; error?: string }) => {
			if (!response.success) {
				setError(response.error || 'Ошибка старта игры');
			}
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div className="text-emerald-500 text-2xl font-bold uppercase animate-pulse">Загрузка...</div>
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
		<>
			<div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
				<div className="max-w-6xl mx-auto px-4 py-8">
					<LobbyHeader code={code} currentPlayers={players.length} maxPlayers={room?.maxPlayers || 0} />

				<LobbyPlayers 
					players={players} 
					maxPlayers={room?.maxPlayers || 0} 
					currentPlayerId={playerId?.toString() || null}
					isHost={!!isHost}
					onKickPlayer={handleKickPlayer}
				/>

					<LobbyControls
						isHost={!!isHost}
						playersCount={players.length}
						minPlayers={4}
						isConnected={isConnected}
						onStartGame={handleStartGame}
						error={error}
					/>

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
