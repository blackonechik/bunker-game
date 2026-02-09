'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LoadingDoors } from '@/components/ui/LoadingDoors';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showStart, setShowStart] = useState(true);
  const [showDoors, setShowDoors] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const doorAudioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const handleStart = () => {
    setShowStart(false);
    setShowDoors(true);
    
    // Запускаем звук открытия двери
    if (doorAudioRef.current) {
      doorAudioRef.current.volume = 0.5;
      doorAudioRef.current.play().catch(() => {});
    }
  };

  const handleDoorsComplete = () => {
    setShowDoors(false);
    setShowMenu(true);
    
    // Пытаемся запустить музыку после открытия дверей
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Громкость 30%
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {
          // Autoplay заблокирован - ждем взаимодействия пользователя
          setIsMusicPlaying(false);
        });
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => setIsMusicPlaying(false));
      }
    }
  };

  const handlePlay = () => {
    // Пытаемся включить музыку при первом клике
    if (!isMusicPlaying && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {});
    }
    router.push('/create');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      {/* Видео фон */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-40"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Затемняющий оверлей */}
      <div className="fixed inset-0 bg-zinc-950/50 z-0" />

      {/* Аудио для музыки */}
      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      {/* Аудио для звука открытия двери */}
      <audio ref={doorAudioRef}>
        <source src="/opendoor.mp3" type="audio/mpeg" />
      </audio>

      {/* Стартовый экран */}
      {showStart && (
        <div className="fixed inset-0 z-[250] bg-zinc-950 flex items-center justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            onClick={handleStart}
            className="group relative px-12 py-6 bg-zinc-900 border-4 border-amber-500 hover:bg-amber-500/10 transition-all duration-300"
          >
            <span className="text-3xl font-black uppercase tracking-widest text-amber-500 group-hover:text-amber-400">
              Нажмите, чтобы начать приключение
            </span>
            <div className="absolute inset-0 border-2 border-amber-500/20 scale-105" />
          </motion.button>
        </div>
      )}

      {/* Загрузочные двери */}
      {showDoors && <LoadingDoors onComplete={handleDoorsComplete} />}

      {/* Кнопка управления звуком */}
      {showMenu && (
        <button
          onClick={toggleMusic}
          className="fixed top-8 right-8 z-30 p-3 bg-zinc-900/80 border border-zinc-700 hover:border-amber-500 transition-colors rounded backdrop-blur-sm"
          title={isMusicPlaying ? 'Выключить музыку' : 'Включить музыку'}
        >
          {isMusicPlaying ? (
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707l-4.707-4.707z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.414H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707l-4.707-4.707zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      )}

      {/* Главное меню */}
      {showMenu && (
        <main className="relative z-20 max-w-6xl mx-auto px-4 py-8">
          <section className="min-h-screen flex flex-col items-center justify-center text-center space-y-12">
            {/* Логотип */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600 uppercase">
                Bunker
              </h1>
              <span className='absolute bottom-0 -left-4 px-1 py-[1px] bg-emerald-500 text-black text-xs font-bold uppercase -rotate-12'>
                12+
              </span>
              <span className="absolute -top-4 -right-4 px-2 py-1 bg-amber-500 text-black text-sm font-bold uppercase rotate-12">
                Protocol 404
              </span>
            </motion.div>

            {/* Кнопки меню */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col gap-4 w-full max-w-xs"
            >
              <button
                onClick={handlePlay}
                className="group relative px-8 py-4 bg-zinc-800 border-2 border-zinc-600 hover:border-emerald-500 transition-all duration-300"
              >
                <span className="relative z-10 text-xl font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                  Играть
                </span>
                <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>

              <button className="group relative px-8 py-4 border-2 border-transparent hover:text-zinc-400 transition-all duration-300 italic opacity-50">
                Об авторах
              </button>
            </motion.div>
          </section>
        </main>
      )}

      {/* Футер */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 p-8 text-center z-20">
        <div className="text-[10px] text-zinc-700 font-bold tracking-[0.5em] uppercase">
          Radiation Warning: High • Protocol 404 Active
        </div>
      </footer>
    </div>
  );
}
