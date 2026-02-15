'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/shared/lib/auth-client';
import { LoadingDoors } from '@/shared/ui/loading-doors';
import { BackgroundVideo } from '@/shared/ui/background-video';
import { StartScreen } from '@/widgets/start-screen';
import { MainMenu } from '@/widgets/main-menu';

export default function Home() {
  const { data: session, isPending } = useSession();
  const [showStart, setShowStart] = useState(false);
  const [showDoors, setShowDoors] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const doorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isPending) return;

    const timer = setTimeout(() => {
      const hasAuth = Boolean(session);
      if (hasAuth) {
        setShowMenu(true);
      } else {
        setShowStart(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isPending, session]);

  const handleStart = () => {
    setShowStart(false);
    setShowDoors(true);
    doorAudioRef.current?.play().catch(() => { });
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


  return (
    <div className="relative min-">
      <BackgroundVideo />

      <audio ref={audioRef} src="/audio/music.mp3" loop />
      <audio ref={doorAudioRef} src="/audio/opendoor.mp3" />

      {showStart && <StartScreen onStart={handleStart} />}
      {showDoors && <LoadingDoors onComplete={handleDoorsComplete} />}
      <MainMenu isMusicPlaying={isMusicPlaying} onToggleMusic={toggleMusic} />
    </div>
  );
}
