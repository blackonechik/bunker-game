'use client';

import { motion } from 'framer-motion';

interface TitleProps {
  className?: string;
	children?: React.ReactNode;
}

export function Title({ children, className = '' }: TitleProps) {

	return (
		<motion.h1
			initial={{ opacity: 0, y: 50 }}
			animate={{ opacity: 1, y: 0 }}
			className={`text-5xl max-md:text-4xl max-w- font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600 uppercase${className}`}
		>
			{children}
    </motion.h1>
  );
}
