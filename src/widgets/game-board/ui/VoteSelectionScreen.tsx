'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/shared/ui';
import { Title } from '@/src/shared/ui/title';
import { VoteSelectionScreenProps } from '../types';
import { VOTE_APPEARANCE, VoteOptionCard } from './vote-selection';

export function VoteSelectionScreen({
	title,
	options,
	onSelect,
	mode,
}: VoteSelectionScreenProps) {
	const appearance = VOTE_APPEARANCE[mode];
	const [activeIndex, setActiveIndex] = useState(0);
	const normalizedActiveIndex = options.length === 0 ? 0 : Math.min(activeIndex, options.length - 1);

	const goPrev = () => {
		setActiveIndex((prev) => (prev === 0 ? options.length - 1 : prev - 1));
	};

	const goNext = () => {
		setActiveIndex((prev) => (prev === options.length - 1 ? 0 : prev + 1));
	};

	return (
		<div className="relative z-10 container mx-auto px-6 py-12">
			<div className="mb-12 text-center">
				<Title className="mb-4">
					Выберите {title}
				</Title>
			</div>

			<section className="hidden max-md:block space-y-6">
				<div className="overflow-hidden">
					<motion.div
						className="flex"
						animate={{ x: `-${normalizedActiveIndex * 100}%` }}
						transition={{ duration: 0.35, ease: 'easeInOut' }}
					>
						{options.map((option, index) => {
							const isActive = index === normalizedActiveIndex;

							return (
								<VoteOptionCard
									key={option.id}
									option={option}
									isActive={isActive}
									hoverBorderClass={appearance.hoverBorder}
									titleClassName={isActive ? appearance.activeTextColor : ''}
									cornerClassName={appearance.corner}
									descriptionMinHeightClass="min-h-[140px]"
									onSelect={onSelect}
								/>
							);
						})}
					</motion.div>
				</div>

				{options.length > 1 && (
					<div className="flex items-center justify-center gap-3">
						<Button size="small" variant="secondary" onClick={goPrev}>Назад</Button>
						<span className="text-xs text-zinc-500 uppercase tracking-[0.18em]">
							{normalizedActiveIndex + 1} / {options.length}
						</span>
						<Button size="small" variant="secondary" onClick={goNext}>Вперёд</Button>
					</div>
				)}
			</section>

			<section className="grid grid-cols-3 max-lg:grid-cols-2 max-md:hidden gap-8">
				{options.map((option) => (
					<VoteOptionCard
						key={option.id}
						option={option}
						hoverBorderClass={appearance.hoverBorder}
						titleClassName={appearance.hoverText}
						cornerClassName={appearance.corner}
						descriptionMinHeightClass="min-h-[160px]"
						onSelect={onSelect}
					/>
				))}
			</section>
		</div>
	);
}
