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
		<article className="min-w-[85vw] md:min-w-0 snap-center group relative bg-zinc-900/80 border-2 border-zinc-800 p-1 flex flex-col transition-all duration-500 shadow-[rgba(0,0,0,0.9)_0px_0px_40px_inset,rgba(0,0,0,0.5)_0px_10px_30px]" onMouseEnter={playConfirmation}>
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
						<svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
							<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.168.575-.532 1.039-1.079 1.132-.387.066-.75-.021-1.066-.234l-2.022-1.425-1.016.945c-.144.133-.311.199-.5.199-.188 0-.365-.06-.519-.176l-.105-.084-2.843-1.895c-.482-.321-.735-.742-.718-1.198.016-.456.303-.861.815-1.144 1.112-.614 6.746-2.903 7.027-3.012.28-.109.58-.152.846-.051.266.101.442.348.497.632.024.123.044.47-.156.9z"></path>
						</svg>
					</a>
				</div>
			</div>
		</article>
	);
}
