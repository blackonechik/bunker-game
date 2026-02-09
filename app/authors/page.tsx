'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthorsHeader } from '@/src/widgets/authors-header';
import { AuthorsList } from '@/src/widgets/authors-list';
import { Button } from '@/src/shared/ui';
import type { Author } from '@/src/entities/author';

const authors: Author[] = [
	{
		id: 1,
		name: 'Владислав',
		nickname: 'blackonechik',
		role: 'Lead Developer // Full-Stack',
		description:
			'Архитектор системы и разработчик полного цикла. Создатель протокола 404 и всей инфраструктуры убежища.',
		telegramHandle: 'blackonechik',
		accentColor: 'emerald',
	},
	{
		id: 2,
		name: 'Александра',
		nickname: 'aleksa_creat',
		role: 'Visual Designer // UI/UX',
		description:
			'Дизайнер брутального постапокалиптического стиля. Создатель визуального языка терминалов убежища.',
		telegramHandle: 'aleksa_creat',
		accentColor: 'amber',
	},
];

export default function AuthorsPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
			{/* Atmospheric Overlays */}
			<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/60" />
				<div className="absolute w-1 h-1 bg-amber-400 rounded-full animate-ping top-1/4 left-1/3 opacity-50" />
				<div className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-ping top-3/4 left-2/3 opacity-40" />
			</div>

			{/* Main Content */}
			<main className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-20">
				{/* Back Button */}
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start">
					<Button variant="secondary" size="small" onClick={() => router.push('/')} className="flex items-center gap-2">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Назад
					</Button>
				</motion.div>

				{/* Header */}
				<AuthorsHeader />

				{/* Authors List */}
				<AuthorsList authors={authors} />

				{/* Call to Action */}
				<section className="flex flex-col items-center gap-10">
					<div className="h-px w-full max-w-md bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
					<Button
						variant="start"
						size="large"
						onClick={() => router.push('/')}
						className="relative group overflow-hidden"
					>
						<div className="absolute inset-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
						<span className="relative z-10">Terminal Return</span>
						<div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 translate-x-1/2 -translate-y-1/2 rotate-45" />
					</Button>
					<div className="flex items-center gap-3">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						<p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
							All system units active // No breach detected
						</p>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="mt-20 border-t border-zinc-900 bg-black/40 backdrop-blur-md p-10 relative z-10 overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,#f59e0b,#f59e0b_20px,#000_20px,#000_40px)] opacity-40" />
				<div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="text-[10px] text-zinc-600 font-bold tracking-[0.2em] text-center md:text-left">
						PROTOCOL 404 <br /> ARCHIVE-ID: BUNKER-S7
					</div>
					<div className="text-[9px] text-zinc-700 uppercase italic max-w-xs text-center md:text-right">
						Property of the Core Administration. Unauthorized duplication will result in immediate life-support
						termination.
					</div>
				</div>
			</footer>
		</div>
	);
}
