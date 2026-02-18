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
	{
		id: 3,
		name: 'Денис',
		nickname: 'Anonym_Code',
		role: 'Тестировщик',
		description:
			'Специалист по контролю качества. Обеспечивает стабильность работы систем убежища.',
		telegramHandle: 'Anonym_Code',
		accentColor: 'blue',
	},
];

export default function AuthorsPage() {
	const router = useRouter();

	return (
		<div className="overflow-x-hidden relative">

			{/* Main Content */}

				{/* Back Button */}
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="self-start">
					<Button variant="secondary" size="small" onClick={() => router.push('/')}>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Назад
					</Button>
				</motion.div>

				{/* Header */}
				<AuthorsHeader className='mb-20'/>

				{/* Authors List */}
				<AuthorsList authors={authors} />

				{/* Call to Action */}
				<section className="flex flex-col items-center gap-10">
					<div className="h-px w-full max-w-md bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
					<div className="flex items-center gap-3">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						<p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
							All system units active // No breach detected
						</p>
					</div>
				</section>
		</div>
	);
}
