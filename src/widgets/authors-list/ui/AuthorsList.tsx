'use client';

import { AuthorCard, type Author } from '@/src/entities/author';

interface AuthorsListProps {
	authors: Author[];
}

export function AuthorsList({ authors }: AuthorsListProps) {
	return (
		<section>
			<div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-8 pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-amber-500">
				{authors.map((author) => (
					<AuthorCard key={author.id} author={author} />
				))}
			</div>
		</section>
	);
}
