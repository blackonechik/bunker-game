'use client';

import { motion } from 'framer-motion';
import { PlayerCard, EmptyPlayerSlot } from '@/shared/ui';
import { PlayerDTO } from '@/shared/types';

interface LobbyPlayersProps {
	players: PlayerDTO[];
	maxPlayers: number;
	currentPlayerId: string | null;
	isHost: boolean;
	onKickPlayer?: (playerId: number) => void;
}

export function LobbyPlayers({ players, maxPlayers, currentPlayerId, isHost, onKickPlayer }: LobbyPlayersProps) {
	const emptySlots = maxPlayers - players.length;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.2 }}
			className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
		>
			{players.map((player, index) => {
				const isYou = player.id.toString() === currentPlayerId;

				return (
					<PlayerCard
						key={player.id}
						name={player.name}
						isHost={player.isHost}
						isYou={isYou}
						isOnline={player.isOnline}
						isBot={player.isBot}
						animationDelay={index * 0.05}
						canKick={isHost}
						onKick={() => onKickPlayer?.(player.id)}
					/>
				);
			})}

			{Array.from({ length: emptySlots }).map((_, index) => (
				<EmptyPlayerSlot key={`empty-${index}`} animationDelay={(players.length + index) * 0.05} />
			))}
		</motion.div>
	);
}
