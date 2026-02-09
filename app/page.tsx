'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingDoors } from '@/shared/ui/loading-doors';
import { BackgroundVideo } from '@/shared/ui/background-video';
import { MusicButton } from '@/shared/ui/music-button';
import { StartScreen } from '@/widgets/start-screen';
import { MainMenu } from '@/widgets/main-menu';

export default function Home() {
  const [showStart, setShowStart] = useState(true);
  const [showDoors, setShowDoors] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const doorAudioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Проверяем sessionStorage после монтирования на клиенте
  useEffect(() => {
    setMounted(true);
    const introShown = sessionStorage.getItem('bunker_intro_shown') === 'true';
    if (introShown) {
      setShowStart(false);
      setShowMenu(true);
    }
  }, []);

  const handleStart = () => {
    setShowStart(false);
    setShowDoors(true);
    sessionStorage.setItem('bunker_intro_shown', 'true');
    doorAudioRef.current?.play().catch(() => {});
  };

  const handleDoorsComplete = () => {
    setShowDoors(false);
    setShowMenu(true);
    audioRef.current?.play()
      .then(() => setIsMusicPlaying(true))
      .catch(() => setIsMusicPlaying(false));
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(false));
    }
  };

  const handlePlay = () => {
    if (!isMusicPlaying && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {});
    }
    router.push('/create');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      <BackgroundVideo />

      <audio ref={audioRef} src="/audio/music.mp3" loop />
      <audio ref={doorAudioRef} src="/audio/opendoor.mp3" />

      {mounted && (
        <>
          {showStart && <StartScreen onStart={handleStart} />}
          {showDoors && <LoadingDoors onComplete={handleDoorsComplete} />}
          {showMenu && (
            <>
              <MusicButton isPlaying={isMusicPlaying} onToggle={toggleMusic} />
              <MainMenu onPlay={handlePlay} />
            </>
          )}
        </>
      )}

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 p-8 text-center z-20">
        <div className="text-[10px] text-zinc-700 font-bold tracking-[0.5em] uppercase">
          Radiation Warning: High • Protocol 404 Active
        </div>
      </footer>
    </div>
  );
}
