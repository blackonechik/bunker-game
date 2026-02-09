'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../button';
import { TextInput } from '../text-input';

interface NameModalProps {
	isOpen: boolean;
	onSubmit: (name: string) => void;
	title?: string;
	description?: string;
}

export function NameModal({
	isOpen,
	onSubmit,
	title = 'Добро пожаловать в бункер',
	description = 'Представьтесь, чтобы продолжить',
}: NameModalProps) {
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = () => {
		const trimmedName = name.trim();
		
		if (!trimmedName) {
			setError('Имя не может быть пустым');
			return;
		}

		if (trimmedName.length < 2) {
			setError('Имя должно содержать минимум 2 символа');
			return;
		}

		if (trimmedName.length > 20) {
			setError('Имя не должно превышать 20 символов');
			return;
		}

		onSubmit(trimmedName);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
				>
					<motion.div
						initial={{ scale: 0.9, y: 20 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.9, y: 20 }}
						className="bg-zinc-900 border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full mx-4"
					>
						{/* Заголовок */}
						<div className="border-b-4 border-zinc-800 p-6 bg-[repeating-linear-gradient(45deg,#18181b,#18181b_10px,#000_10px,#000_20px)]">
							<h2 className="text-2xl font-black uppercase italic text-amber-500 mb-2">
								{title}
							</h2>
							<p className="text-sm text-zinc-400 uppercase tracking-wider">{description}</p>
						</div>

						{/* Контент */}
						<div className="p-6 space-y-6">
							<TextInput
								label="Ваше имя"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Введите имя..."
								maxLength={20}
								autoFocus
								onKeyPress={handleKeyPress}
							/>

							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="text-red-500 text-xs font-bold uppercase border-l-4 border-red-500 pl-3 py-2"
								>
									{error}
								</motion.div>
							)}

							<div className="w-full">
								<Button onClick={handleSubmit} variant="primary" size="large" disabled={!name.trim()}>
									Продолжить
								</Button>
							</div>
						</div>

						{/* Нижняя полоса */}
						<div className="border-t-4 border-zinc-800 h-2 bg-[repeating-linear-gradient(90deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)]" />
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
