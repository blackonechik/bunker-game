'use client';

import { ButtonHTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useSound } from '@/hooks/use-sound';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'start';
  animated?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  animated = false,
  children, 
  className = '', 
  onClick,
  ...props 
}: ButtonProps & Partial<MotionProps>) {
  const { playClick } = useSound();
  const Component = animated ? motion.button : 'button';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  if (variant === 'start') {
    return (
      <Component
        initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={animated ? { duration: 0.5 } : undefined}
        onClick={handleClick}
        className={`group relative px-12 py-6 bg-zinc-900 border-4 border-amber-500 hover:bg-amber-500/10 transition-all duration-300 ${className}`}
        {...props}
      >
        <span className="text-3xl font-black uppercase tracking-widest text-amber-500 group-hover:text-amber-400">
          {children}
        </span>
        <div className="absolute inset-0 border-2 border-amber-500/20 scale-105" />
      </Component>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleClick}
        className={`group relative px-8 py-4 border-2 border-transparent hover:text-zinc-400 transition-all duration-300 italic opacity-50 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group relative px-8 py-4 bg-zinc-800 border-2 border-zinc-600 hover:border-emerald-500 transition-all duration-300 ${className}`}
      {...props}
    >
      <span className="relative z-10 text-xl font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
        {children}
      </span>
      <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
}
