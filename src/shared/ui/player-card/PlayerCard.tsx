'use client';

import { motion } from 'framer-motion';

interface PlayerCardProps {
	name: string;
	isHost: boolean;
	isYou: boolean;
	animationDelay?: number;
}

export function PlayerCard({ name, isHost, isYou, animationDelay = 0 }: PlayerCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: animationDelay }}
			className={`p-4 border-2 ${
				isYou ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'
			} flex flex-col items-center gap-2`}
		>
			<div
				className={`w-12 h-12 ${
					isYou ? 'bg-emerald-500' : 'bg-zinc-800'
				} rounded-full flex items-center justify-center ${
					isYou ? 'text-black' : 'text-zinc-600'
				} font-bold border-2 ${isYou ? 'border-emerald-500' : 'border-zinc-700'}`}
			>
				{isYou ? 'ВЫ' : name.substring(0, 2).toUpperCase()}
			</div>
			<span className="text-xs font-bold uppercase truncate w-full text-center">{name}</span>
			{isHost && <span className="text-[10px] text-amber-500 font-bold uppercase">Владелец бункера</span>}
		</motion.div>
	);
}
