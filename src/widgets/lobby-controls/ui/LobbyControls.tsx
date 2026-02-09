'use client';

import { motion } from 'framer-motion';
import { Button } from '@/shared/ui';

interface LobbyControlsProps {
	isHost: boolean;
	playersCount: number;
	minPlayers: number;
	isConnected: boolean;
	onStartGame: () => void;
	error?: string;
}

export function LobbyControls({
	isHost,
	playersCount,
	minPlayers,
	isConnected,
	onStartGame,
	error,
}: LobbyControlsProps) {
	const canStart = playersCount >= minPlayers && isConnected;

	return (
		<>
			{isHost && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="flex justify-center"
				>
					<Button onClick={onStartGame} disabled={!canStart} variant="primary" size="large">
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
