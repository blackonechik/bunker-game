'use client';

import { motion } from 'framer-motion';

interface PlayerCardProps {
	name: string;
	isHost: boolean;
	isYou: boolean;
	isOnline: boolean;
	isBot?: boolean;
	animationDelay?: number;
	onKick?: () => void;
	canKick?: boolean;
}

export function PlayerCard({ name, isHost, isYou, isOnline, isBot = false, animationDelay = 0, onKick, canKick }: PlayerCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: animationDelay }}
			className={`relative p-4 border-2 ${
				isYou ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'
			} flex flex-col items-center gap-2 ${!isOnline ? 'opacity-50' : ''}`}
		>
			{/* Индикатор онлайн */}
			<div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />

			{/* Кнопка удаления */}
			{canKick && !isYou && !isHost && (
				<button
					onClick={onKick}
					className="absolute top-2 left-2 w-5 h-5 bg-red-600 text-white rounded-sm flex items-center justify-center hover:bg-red-700 transition-colors text-xs font-bold"
					title="Удалить игрока"
				>
					×
				</button>
			)}

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
			{isBot && <span className="text-[10px] text-sky-400 font-bold uppercase">Бот</span>}
			{isHost && <span className="text-[10px] text-amber-500 font-bold uppercase">Владелец бункера</span>}
			{!isOnline && <span className="text-[10px] text-red-500 font-bold uppercase">Оффлайн</span>}
		</motion.div>
	);
}
