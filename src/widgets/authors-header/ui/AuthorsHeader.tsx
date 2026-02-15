interface AuthorsHeaderProps {
	className?: string;
}

export function AuthorsHeader({className}: AuthorsHeaderProps) {
	return (
		<section className={`text-center space-y-8 ${className}`}>
			<div className="inline-block relative">
				<h1 className="text-8xl max-md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-600">
						ОБ АВТОРАХ
					</h1>
				<div className="whitespace-nowrap bg-emerald-500 text-black text-[10px] font-bold px-4 py-1 skew-x-[-12deg] tracking-[0.3em]">
					DATA ENCRYPTED // LEVEL 5 ACCESS
				</div>
			</div>
		</section>
	);
}
