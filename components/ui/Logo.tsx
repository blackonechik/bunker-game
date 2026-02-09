'use client';

import { motion } from 'framer-motion';

export function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600 uppercase">
        Bunker
      </h1>
      <span className="absolute bottom-0 -left-4 px-1 py-px bg-emerald-500 text-black text-xs font-bold uppercase -rotate-12">
        12+
      </span>
      <span className="absolute -top-4 -right-4 px-2 py-1 bg-amber-500 text-black text-sm font-bold uppercase rotate-12">
        Protocol 404
      </span>
    </motion.div>
  );
}
