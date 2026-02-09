'use client';

import { ButtonHTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useSound } from '@/hooks/use-sound';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'start';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary',
  size = 'medium',
  animated = false,
  children, 
  className = '', 
  onClick,
  ...props 
}: ButtonProps & Partial<MotionProps>) {
  const { playClick } = useSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-8 py-4 text-xl',
    large: 'px-12 py-6 text-2xl'
  };

  if (variant === 'start') {
    return (
      <button
      onClick={handleClick}
      className={`group relative ${sizeClasses[size]} bg-zinc-800 border-2 border-amber-500 hover:border-amber-500 transition-all duration-300 ${className}`}
      {...props}
    >
      <span className="relative z-10 font-bold uppercase tracking-widest group-hover:text-amber-500 transition-colors text-amber-400">
        {children}
      </span>
      <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
      onClick={handleClick}
      className={`group relative ${sizeClasses[size]} bg-zinc-800 border-2 border-zinc-600 hover:border-emerald-500 transition-all duration-300 ${className}`}
      {...props}
    >
      <span className="relative z-10 font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors flex gap-2 items-center justify-center">
        {children}
      </span>
      <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group relative ${sizeClasses[size]} bg-zinc-800 border-2 border-emerald-500 ld-500 transition-all duration-300 ${className}`}
      {...props}
    >
      <span className="relative z-10 text-emerald-500 font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
        {children}
      </span>
      <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
}
