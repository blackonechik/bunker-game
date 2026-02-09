'use client';

import { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	variant?: 'emerald' | 'amber';
}

export function TextInput({ label, variant = 'emerald', className = '', ...props }: TextInputProps) {
	const variantClasses = {
		emerald: 'focus:border-emerald-500 text-emerald-400',
		amber: 'focus:border-amber-500 text-amber-400',
	};

	return (
		<div className="space-y-2">
			<label className="text-xs uppercase text-zinc-500 font-bold">{label}</label>
			<input
				className={`w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 outline-none font-bold uppercase transition-colors ${variantClasses[variant]} ${className}`}
				{...props}
			/>
		</div>
	);
}
