'use client';

import { Button } from '@/src/shared/ui';

interface VoteOptionItem {
	id: number;
	name: string;
	description: string;
	image: string;
}

interface VoteSelectionScreenProps {
	title: string;
	accentText: string;
	options: VoteOptionItem[];
	onSelect: (id: number) => void;
	mode: 'apocalypse' | 'location';
}

const APPEARANCE = {
	apocalypse: {
		hoverBorder: 'hover:border-orange-600/50',
		badgeBg: 'bg-orange-600',
		hoverText: 'group-hover:text-orange-500',
		buttonHover: 'group-hover:bg-orange-600 group-hover:text-black',
		corner: 'border-orange-600',
	},
	location: {
		hoverBorder: 'hover:border-green-600/50',
		badgeBg: 'bg-green-600',
		hoverText: 'group-hover:text-green-500',
		buttonHover: 'group-hover:bg-green-600 group-hover:text-black',
		corner: 'border-green-600',
	},
} as const;

export function VoteSelectionScreen({
	title,
	accentText,
	options,
	onSelect,
	mode,
}: VoteSelectionScreenProps) {
	const appearance = APPEARANCE[mode];

	return (
		<div className="relative z-10 container mx-auto px-6 py-12">
			<div className="mb-12 text-center">
				<h2 className="text-4xl md:text-6xl font-black uppercase text-zinc-100 mb-2">
					{title} <span className="text-orange-600">{accentText}</span>
				</h2>
			</div>

			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
				{options.map((option) => (
					<article
						key={option.id}
						className={`relative bg-zinc-900 border-2 border-zinc-800 p-2 transition-all duration-300 ${appearance.hoverBorder}`}
					>

						<div className=" h-64 border border-zinc-800">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={option.image || 'https://images.unsplash.com/photo-1523575708161-ad0fc2a9b951?auto=format&fit=crop&q=80&w=1200'}
								alt={option.name}
								className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-60 group-hover:opacity-100"
							/>
						</div>

						<div className="p-4 bg-zinc-900 flex flex-col">
							<h3 className={`text-xl font-bold text-zinc-100 uppercase mb-2 transition-colors ${appearance.hoverText}`}>
								{option.name}
							</h3>
							<p className="text-sm text-zinc-400 mb-6 min-h-[160px]">{option.description}</p>
							<Button className='w-full mt-auto' size='small' onClick={() => onSelect(option.id)}>
								Голосовать
							</Button>
						</div>

						<div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${appearance.corner}`} />
					</article>
				))}
			</section>
		</div>
	);
}
