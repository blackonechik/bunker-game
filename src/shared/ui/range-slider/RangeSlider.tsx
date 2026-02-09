'use client';

import { InputHTMLAttributes } from 'react';

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label: string;
	value: number;
	variant?: 'emerald' | 'amber';
}

export function RangeSlider({ label, value, variant = 'emerald', className = '', ...props }: RangeSliderProps) {
	const accentClass = variant === 'emerald' ? 'accent-emerald-500' : 'accent-amber-500';

	return (
		<div className="space-y-2">
			<label className="text-xs uppercase text-zinc-500 font-bold">{label}</label>
			<input
				type="range"
				value={value}
				className={`w-full ${accentClass} bg-zinc-800 ${className}`}
				{...props}
			/>
		</div>
	);
}
