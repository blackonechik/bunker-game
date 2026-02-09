'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';

export function MainMenu() {
  const router = useRouter();
  return (

    <section className="min-h-screen flex flex-col items-center justify-center text-center space-y-12">
      <Logo size='large' />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <Button onClick={() => router.push('/create')}>
          Играть
        </Button>

        <Button variant='secondary' size='small' onClick={() => router.push('/authors')}>
          Об авторах
        </Button>
      </motion.div>
    </section>
  );
}
