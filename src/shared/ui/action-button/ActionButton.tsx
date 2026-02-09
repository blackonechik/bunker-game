'use client';

import { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/use-sound';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'solid-emerald' | 'outline-amber';
	loading?: boolean;
	loadingText?: string;
}

export function ActionButton({
	variant = 'solid-emerald',
	loading = false,
	loadingText,
	children,
	className = '',
	onClick,
	disabled,
	...props
}: ActionButtonProps) {
	const { playClick } = useSound();

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!loading && !disabled) {
			playClick();
			onClick?.(e);
		}
	};

	const variantClasses = {
		'solid-emerald':
			'bg-emerald-600 text-black hover:bg-emerald-400 transition-colors',
		'outline-amber':
			'border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300',
	};

	return (
		<motion.button
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			onClick={handleClick}
			disabled={loading || disabled}
			className={`w-full py-4 font-black uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{...(props as any)}
		>
			{loading ? loadingText || 'Загрузка...' : children}
		</motion.button>
	);
}
