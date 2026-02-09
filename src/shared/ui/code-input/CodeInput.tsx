'use client';

interface CodeInputProps {
	label: string;
	value: string[];
	onChange: (value: string[]) => void;
	onFocus?: () => void;
	variant?: 'emerald' | 'amber';
	length?: number;
}

export function CodeInput({
	label,
	value,
	onChange,
	onFocus,
	variant = 'amber',
	length = 4,
}: CodeInputProps) {
	const variantClasses = {
		emerald: 'text-emerald-500 focus:border-emerald-500',
		amber: 'text-amber-500 focus:border-amber-500',
	};

	const handleInput = (index: number, inputValue: string) => {
		let newValue = inputValue;
		if (newValue.length > 1) newValue = newValue[0];

		const newCode = [...value];
		newCode[index] = newValue.toUpperCase();
		onChange(newCode);

		// Автоматический переход к следующему полю
		if (newValue && index < length - 1) {
			const nextInput = document.getElementById(`code-${index + 1}`);
			nextInput?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === 'Backspace' && !value[index] && index > 0) {
			const prevInput = document.getElementById(`code-${index - 1}`);
			prevInput?.focus();
		}
	};

	return (
		<div className="space-y-2">
			<label className="text-xs uppercase text-zinc-500 font-bold">{label}</label>
			<div className="grid grid-cols-4 gap-2">
				{Array.from({ length }).map((_, index) => (
					<input
						key={index}
						id={`code-${index}`}
						type="text"
						maxLength={1}
						value={value[index] || ''}
						onChange={(e) => handleInput(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onFocus={onFocus}
						className={`w-full aspect-square bg-zinc-800 border-2 border-zinc-700 text-center text-3xl font-black outline-none uppercase ${variantClasses[variant]}`}
					/>
				))}
			</div>
		</div>
	);
}
