'use client';

import { AuthorCard, type Author } from '@/src/entities/author';

interface AuthorsListProps {
	authors: Author[];
}

export function AuthorsList({ authors }: AuthorsListProps) {
	return (
		<section>
			<div className="grid grid-cols-2 gap-8 pb-8 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-amber-500 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory">
				{authors.map((author) => (
					<AuthorCard key={author.id} author={author} />
				))}
			</div>
		</section>
	);
}
