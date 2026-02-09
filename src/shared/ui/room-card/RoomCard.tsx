'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useSound } from '../../hooks';

interface RoomCardProps {
	mode: 'create' | 'join';
	isActive: boolean;
	onFocus: () => void;
	children: ReactNode;
	delay?: number;
}

export function RoomCard({ mode, isActive, onFocus, children, delay = 0 }: RoomCardProps) {
	const {playClick} = useSound();
	const config = {
		create: {
			title: 'Создать убежище',
			color: 'emerald',
			borderColor: isActive ? 'border-emerald-500' : 'border-zinc-800',
			dotColor: isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700',
			badge: 'Initialize',
			direction: -20,
		},
		join: {
			title: 'Присоединиться к убежищу',
			color: 'amber',
			borderColor: isActive ? 'border-amber-500' : 'border-zinc-800',
			dotColor: isActive ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700',
			badge: null,
			direction: 20,
		},
	};

	const cardConfig = config[mode];

	const handleClick = () => {
		onFocus();
		playClick();
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: cardConfig.direction }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay }}
			className={`p-8 bg-zinc-900 border-2 ${cardConfig.borderColor} rounded-sm relative cursor-pointer`}
			onClick={handleClick}
		>
			{cardConfig.badge && (
				<div className="absolute top-0 right-0 p-2 bg-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
					{cardConfig.badge}
				</div>
			)}

			<h2 className="text-2xl font-bold uppercase mb-8 flex items-center gap-3">
				<span className={`w-3 h-3 rounded-full ${cardConfig.dotColor}`}></span>
				{cardConfig.title}
			</h2>

			<div className="space-y-6">{children}</div>
		</motion.div>
	);
}
