'use client';

import { InputHTMLAttributes } from 'react';

interface RangeSliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  value: number;
  variant?: 'emerald' | 'amber';
}

export function RangeSlider({
  label,
  value,
  min = 0,
  max = 100,
  variant = 'emerald',
  className = '',
  ...props
}: RangeSliderProps) {
  const percent =
    ((value - Number(min)) / (Number(max) - Number(min))) * 100;

  const color =
    variant === 'emerald'
      ? 'bg-emerald-500 shadow-emerald-500/40'
      : 'bg-amber-500 shadow-amber-500/40';

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase text-zinc-500 font-bold">
        {label}
      </label>

      <div className="relative w-full h-5 select-none">
        {/* Track */}
        <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-zinc-800" />

        {/* Progress */}
        <div
          className={`absolute inset-y-2 left-0 rounded-full ${color} transition-all duration-200 ease-out`}
          style={{ width: `${percent}%` }}
        />

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-200 ease-out ${color}`}
          style={{ left: `calc(${percent}% - 10px)` }}
        />

        {/* Real input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
