'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
	const sizeClasses = {
		small: {
			title: 'text-5xl max-md:text-4xl',
			ageBadge: 'text-[8px] px-0.5 py-px -left-2 bottom-0',
			protocolBadge: 'text-[10px] px-1 py-0.5 -right-2 -top-2'
		},
		medium: {
			title: 'text-9xl max-md:text-7xl',
			ageBadge: 'text-xs px-1 py-px -left-4 bottom-0',
			protocolBadge: 'text-sm px-2 py-1 -right-4 -top-4'
		},
		large: {
			title: 'text-[12rem] max-md:text-7xl',
			ageBadge: 'text-sm px-2 py-1 -left-6 bottom-0 max-md:px-1 max-md:py-px',
			protocolBadge: 'text-base px-3 py-1.5 -right-8 -top-6 max-md:px-2 max-md:py-1'
		}
	};

	const classes = sizeClasses[size];

	return (
		<motion.div
			initial={{ opacity: 0, y: 50 }}
			animate={{ opacity: 1, y: 0 }}
			className={`relative flex items-center justify-center w-[min-content] ${className}`}
		>
			<h1 className={`${classes.title} font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600 uppercase`}>
				Bunker
			</h1>

			<span className={`absolute ${classes.ageBadge} bg-emerald-500 text-black font-bold uppercase -rotate-12`}>
				12+
			</span>
			<span className={`absolute ${classes.protocolBadge} bg-amber-500 text-black font-bold uppercase rotate-12`}>
        404 Protocol
      </span>

    </motion.div>
  );
}
