'use client';

import { Button } from '@/shared/ui/button';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="fixed inset-0 z-250 bg-zinc-950 flex items-center justify-center p-3">
      <Button variant="start" animated onClick={onStart}>
        Нажмите, чтобы начать приключение
      </Button>
    </div>
  );
}
