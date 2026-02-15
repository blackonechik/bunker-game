'use client';

import { useSound } from '@/src/shared/hooks';
import { Author } from '../model';


interface AuthorCardProps {
	author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
	const { playConfirmation } = useSound();
	const colorClasses = {
		emerald: {
			border: 'group-hover:border-emerald-500',
			accent: 'group-hover:text-emerald-500/20',
			line: 'group-hover:bg-emerald-500/30',
			dot: 'group-hover:bg-emerald-500',
			title: 'group-hover:text-emerald-400',
			tag: 'text-emerald-500',
			button: 'hover:bg-emerald-500',
		},
		amber: {
			border: 'group-hover:border-amber-500',
			accent: 'group-hover:text-amber-500/20',
			line: 'group-hover:bg-amber-500/30',
			dot: 'group-hover:bg-amber-500',
			title: 'group-hover:text-amber-400',
			tag: 'text-amber-500',
			button: 'hover:bg-amber-500',
		},
		blue: {
			border: 'group-hover:border-blue-500',
			accent: 'group-hover:text-blue-500/20',
			line: 'group-hover:bg-blue-500/30',
			dot: 'group-hover:bg-blue-500',
			title: 'group-hover:text-blue-400',
			tag: 'text-blue-500',
			button: 'hover:bg-blue-500',
		},
	};

	const colors = colorClasses[author.accentColor];

	return (
		<article className="min-w-0 max-md:min-w-[85vw] snap-center group relative bg-zinc-900/80 border-2 border-zinc-800 p-1 flex flex-col transition-all duration-500 shadow-[rgba(0,0,0,0.9)_0px_0px_40px_inset,rgba(0,0,0,0.5)_0px_10px_30px]" onMouseEnter={playConfirmation}>
			{/* Corner decorations */}
			<div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700 ${colors.border}`} />
			<div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700 ${colors.border}`} />
			<div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-700 ${colors.border}`} />
			<div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-700 ${colors.border}`} />

			<div className="p-6 flex flex-col h-full bg-[radial-gradient(circle,rgba(120,53,15,0.1)_0%,transparent_80%)]">
				{/* Header with number */}
				<div className="flex items-center justify-between mb-8">
					<span className={`text-3xl font-black text-zinc-800 ${colors.accent} transition-colors`}>
						{String(author.id).padStart(2, '0')}
					</span>
					<div className={`h-[2px] flex-1 mx-4 bg-zinc-800 ${colors.line}`} />
					<div className={`w-3 h-3 bg-zinc-800 rotate-45 ${colors.dot}`} />
				</div>

				{/* Title */}
				<div className="mb-6">
					<h2 className={`text-2xl font-black text-white uppercase ${colors.title} transition-colors`}>
						{author.name}
					</h2>
					<p className={`text-[10px] tracking-[0.2em] ${colors.tag} font-bold uppercase mt-1`}>{author.role}</p>
				</div>

				{/* Description */}
				<div className="flex-1 space-y-4">
					<p className="text-sm text-zinc-400 leading-relaxed uppercase border-l-2 border-zinc-800 pl-4">
						{author.description}
					</p>
				</div>

				{/* Telegram link */}
				<div className="mt-8 pt-4 border-t border-zinc-800 flex flex-col gap-4">
					<a
						href={`https://t.me/${author.telegramHandle}`}
						target="_blank"
						rel="noopener noreferrer"
						className={`flex items-center justify-between bg-zinc-800/50 px-4 py-3 border border-zinc-700 ${colors.button} hover:text-black transition-all group/btn`}
					>
						<span className="text-xs font-black uppercase tracking-widest italic">Comm Link: TG</span>

						<svg fill="currentColor" className='w-5 h-5' viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10,0 C15.5228475,0 20,4.4771525 20,10 C20,15.5228475 15.5228475,20 10,20 C4.4771525,20 0,15.5228475 0,10 C0,4.4771525 4.4771525,0 10,0 Z M14.4415206,6 C14.060553,6.00676048 13.476055,6.20741135 10.663148,7.36249773 C9.67796175,7.7670526 7.70897661,8.60437935 4.75619264,9.87447795 C4.27670659,10.0627254 4.02553067,10.2468857 4.00266485,10.4269588 C3.95876487,10.7726802 4.46291296,10.8803081 5.09723696,11.0838761 C5.61440201,11.2498453 6.31007997,11.4440124 6.67173438,11.4517262 C6.99978943,11.4587234 7.36593635,11.3251987 7.77017511,11.051152 C10.5290529,9.21254679 11.9531977,8.28322679 12.0426094,8.26319203 C12.1056879,8.24905787 12.1930992,8.23128593 12.2523244,8.28325656 C12.3115496,8.33522719 12.3057275,8.43364956 12.299454,8.46005377 C12.2492926,8.67117474 9.65764825,10.998457 9.50849738,11.1513987 L9.43697409,11.2233057 C8.88741493,11.7661123 8.33196049,12.1205055 9.290333,12.7440164 C10.155665,13.3069957 10.6592923,13.6661378 11.5507686,14.2430701 C12.1204738,14.6117635 12.5671299,15.0489784 13.1553348,14.9955401 C13.4259939,14.9709508 13.705567,14.7196888 13.8475521,13.9703127 C14.1831052,12.1993135 14.8426779,8.36209709 14.9951103,6.78087197 C15.0084653,6.64233621 14.9916649,6.46503787 14.9781732,6.38720805 C14.9646815,6.30937823 14.9364876,6.19848702 14.8340164,6.11639754 C14.7126597,6.01917896 14.5253109,5.99867765 14.4415206,6 Z" /></svg>
					</a>
				</div>
			</div>
		</article>
	);
}
