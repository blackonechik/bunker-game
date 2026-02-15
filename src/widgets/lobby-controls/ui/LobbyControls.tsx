'use client';

import { motion } from 'framer-motion';
import { Button } from '@/shared/ui';

interface LobbyControlsProps {
	isHost: boolean;
	playersCount: number;
	maxPlayers: number;
	minPlayers: number;
	isConnected: boolean;
	onStartGame: () => void;
	onFillBots: () => void;
	error?: string;
}

export function LobbyControls({
	isHost,
	playersCount,
	maxPlayers,
	minPlayers,
	isConnected,
	onStartGame,
	onFillBots,
	error,
}: LobbyControlsProps) {
	const canStart = playersCount >= minPlayers && isConnected;
	const canFillBots = playersCount < maxPlayers && isConnected;

	return (
		<>
			{isHost && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="flex flex-row max-md:flex-col gap-3 justify-center"
				>
					<Button onClick={onFillBots} disabled={!canFillBots} variant="secondary" size="small">
						Заполнить ботами
					</Button>
					<Button onClick={onStartGame} disabled={!canStart} variant="primary" size="small">
						{playersCount < minPlayers ? `Нужно минимум ${minPlayers} игрока` : 'Начать игру'}
					</Button>
				</motion.div>
			)}

			{!isHost && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="text-center text-zinc-500 uppercase text-sm"
				>
					Ожидание старта игры от владельца бункера...
				</motion.div>
			)}

			{error && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-8 p-4 bg-red-900/20 border-2 border-red-500 text-red-400 text-center font-bold uppercase"
				>
					{error}
				</motion.div>
			)}
		</>
	);
}
