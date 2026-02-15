'use client';

import { motion } from 'framer-motion';

export function LoadingDoors({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex pointer-events-none">
      {/* Левая дверь */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '-130%' }}
        transition={{ duration: 2, delay: 3.4, ease: 'easeInOut' }}
        onAnimationComplete={onComplete}
        className="w-1/2 h-full bg-zinc-900 border-r-4 border-zinc-800 relative flex items-center justify-end z-90"
      >
        {/* Декор двери */}
        <div className="absolute top-0 right-0 w-8 h-full bg-[repeating-linear-gradient(-45deg,#f59e0b,#f59e0b_10px,#000_10px,#000_20px)] opacity-20" />
        
        {/* Замок */}
        <div className="w-24 h-24 rounded-full border-8 border-zinc-700 bg-zinc-800 mr-[-52px] z-60 flex items-center justify-center shadow-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="w-16 h-16 rounded-full border-4 border-dashed border-amber-500"
          />
        </div>
      </motion.div>

      {/* Правая дверь */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '130%' }}
        transition={{ duration: 2, delay: 3.54, ease: 'easeInOut' }}
        className="w-1/2 h-full bg-zinc-900 border-l-4 border-zinc-800 relative flex items-center justify-start"
      >
        {/* Декор двери */}
        <div className="absolute top-0 left-0 w-8 h-full bg-[repeating-linear-gradient(-45deg,#f59e0b,#f59e0b_10px,#000_10px,#000_20px)] opacity-20" />
      </motion.div>
    </div>
  );
}
