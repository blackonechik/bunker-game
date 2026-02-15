'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/ui';

interface LobbyHeaderProps {
	code: string;
	currentPlayers: number;
	maxPlayers: number;
}

export function LobbyHeader({ code, currentPlayers, maxPlayers }: LobbyHeaderProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		const link = `${window.location.origin}/lobby/${code}`;
		navigator.clipboard.writeText(link);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex items-end justify-between border-b-2 border-zinc-800 pb-4 mb-8 max-md:flex-col max-md:items-center gap-4"
		>
			<div className='flex flex-col gap-2 max-md:items-center'>
				<h2 className="text-4xl font-black uppercase italic">Зона ожидания</h2>
				<p className="text-zinc-500 uppercase text-xs mt-2">
					Выживших в бункере ({currentPlayers}/{maxPlayers})
				</p>
			</div>

			<Button onClick={handleCopy} variant="secondary" size="small">
				{copied ? '✓ Скопировано' : `ID: ${code} • Нажми, чтобы скопировать`}
			</Button>
		</motion.div>
	);
}
