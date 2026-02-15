export const AppFooter = () => {
  return (
    <footer className="mt-20 border-t border-zinc-900 bg-black/40 backdrop-blur-md p-10 relative z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,#f59e0b,#f59e0b_20px,#000_20px,#000_40px)] opacity-40" />
      <div className="max-w-4xl mx-auto flex flex-row max-md:flex-col justify-between items-center gap-6">
      <div className="text-[10px] text-zinc-600 font-bold tracking-[0.2em] text-left max-md:text-center">
          PROTOCOL 404 <br /> ARCHIVE-ID: BUNKER-S7
        </div>
        <div className="text-[9px] text-zinc-700 uppercase italic max-w-xs text-right max-md:text-center">
          Property of the Core Administration. Unauthorized duplication will result in immediate life-support
          termination.
        </div>
      </div>
    </footer>
  );
};
