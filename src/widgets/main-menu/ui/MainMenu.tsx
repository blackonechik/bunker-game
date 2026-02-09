'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';

interface MainMenuProps {
  onPlay: () => void;
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <main className="relative z-20 max-w-6xl mx-auto px-4 py-8">
      <section className="min-h-screen flex flex-col items-center justify-center text-center space-y-12">
        <Logo size='large'/>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <Button onClick={onPlay}>
            Играть
          </Button>

          <Button variant='secondary' size='small'>
            Об авторах
          </Button>
        </motion.div>
      </section>
    </main>
  );
}
