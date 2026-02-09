export function AuthorsHeader() {
	return (
		<section className="text-center space-y-8">
			<div className="inline-block relative">
				<div className="absolute -inset-4 border border-emerald-500/20 animate-pulse" />
				<div className="bg-zinc-900 px-8 py-4 border-y-2 border-amber-500 relative">
					<h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-600">
						Personnel
					</h1>
					<div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
					<div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
				</div>
				<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-black text-[10px] font-bold px-4 py-1 skew-x-[-12deg] tracking-[0.3em]">
					DATA ENCRYPTED // LEVEL 5 ACCESS
				</div>
			</div>
		</section>
	);
}
