'use client';

interface MusicButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function MusicButton({ isPlaying, onToggle }: MusicButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="p-3 bg-zinc-900/80 border border-zinc-700 hover:border-amber-500 transition-colors rounded backdrop-blur-sm"
      title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
    >
      {isPlaying ? (
        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707l-4.707-4.707z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.414H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707l-4.707-4.707zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      )}
    </button>
  );
}
