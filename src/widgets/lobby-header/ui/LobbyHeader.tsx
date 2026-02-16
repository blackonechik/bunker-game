'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/ui';

interface LobbyHeaderProps {
	code: string;
	currentPlayers: number;
	maxPlayers: number;
	isHost: boolean;
}

export function LobbyHeader({ code, currentPlayers, maxPlayers, isHost }: LobbyHeaderProps) {
	const [copied, setCopied] = useState(false);
	const [isTelegramMiniApp] = useState(() => {
		if (typeof window === 'undefined') return false;
		return Boolean(window.Telegram?.WebApp?.initData);
	});

	const canShareInTelegram = isHost && isTelegramMiniApp;

	const handleCopy = () => {
		const link = `${window.location.origin}/lobby/${code}`;
		navigator.clipboard.writeText(link);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleShareInvite = () => {
		if (typeof window === 'undefined') {
			return;
		}

		const openShare = (shareLink: string) => {
			const telegramWebApp = window.Telegram?.WebApp;

			if (telegramWebApp?.openTelegramLink) {
				telegramWebApp.openTelegramLink(shareLink);
				return;
			}

			window.location.href = shareLink;
		};

		void fetch(`/api/telegram/invite-link/${code}`, {
			method: 'GET',
			cache: 'no-store',
		})
			.then((response) => response.json())
			.then((payload: { success?: boolean; data?: { shareLink?: string } }) => {
				const shareLink = payload.data?.shareLink;
				if (payload.success && shareLink) {
					openShare(shareLink);
					return;
				}

				handleCopy();
			})
			.catch(() => {
				handleCopy();
			});
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

			{canShareInTelegram ? (
				<Button onClick={handleShareInvite} variant="secondary" size="small">
					{`ID: ${code} • Нажми, чтобы отправить`}
				</Button>
			) : (
				<Button onClick={handleCopy} variant="secondary" size="small">
					{copied ? '✓ Скопировано' : `ID: ${code} • Нажми, чтобы скопировать`}
				</Button>
			)}
		</motion.div>
	);
}
