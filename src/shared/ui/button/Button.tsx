'use client';

import { ButtonHTMLAttributes } from 'react';
import { MotionProps } from 'framer-motion';
import { useSound } from '@/src/shared/hooks/use-sound';

type Variant = 'primary' | 'secondary' | 'start';
type Size = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  animated?: boolean;
  children: React.ReactNode;
}

const sizeClasses: Record<Size, string> = {
  small: 'px-4 py-2 text-sm max-md:px-3 max-md:py-1 max-md:text-xs',
  medium: 'px-8 py-4 text-xl max-md:px-6 max-md:py-2 max-md:text-base',
  large: 'px-12 py-6 text-2xl max-md:px-8 max-md:py-4 max-md:text-xl',
};

const variantClasses: Record<
  Variant,
  {
    border: string;
    text: string;
    hoverText: string;
    hoverBorder: string;
    overlay: string;
  }
> = {
  primary: {
    border: 'border-emerald-500',
    hoverBorder: 'hover:border-emerald-400',
    text: 'text-emerald-500',
    hoverText: 'group-hover:text-emerald-400',
    overlay: 'bg-emerald-500',
  },
  secondary: {
    border: 'border-zinc-600',
    hoverBorder: 'hover:border-emerald-500',
    text: 'text-zinc-200',
    hoverText: 'group-hover:text-emerald-400',
    overlay: 'bg-emerald-500',
  },
  start: {
    border: 'border-amber-500',
    hoverBorder: 'hover:border-amber-500',
    text: 'text-amber-400',
    hoverText: 'group-hover:text-amber-500',
    overlay: 'bg-amber-500',
  },
};

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
  const theme = variantClasses[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} group relative ${sizeClasses[size]} bg-zinc-800 border-2 ${theme.border} ${theme.hoverBorder} transition-all duration-300`}
      {...props}
    >
      <span
        className={`relative z-10 font-bold uppercase tracking-widest transition-colors ${theme.text} ${theme.hoverText} flex gap-2 items-center justify-center`}
      >
        {children}
      </span>

      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${theme.overlay}`}
      />
    </button>
  );
}
