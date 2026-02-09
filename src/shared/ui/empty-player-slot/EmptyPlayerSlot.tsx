'use client';

import { motion } from 'framer-motion';

interface EmptyPlayerSlotProps {
	animationDelay?: number;
}

export function EmptyPlayerSlot({ animationDelay = 0 }: EmptyPlayerSlotProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: animationDelay }}
			className="p-4 border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2"
		>
			<div className="w-10 h-10 border border-zinc-800 rounded-full animate-pulse"></div>
			<span className="text-[10px] text-zinc-700 uppercase">Ожидание...</span>
		</motion.div>
	);
}
