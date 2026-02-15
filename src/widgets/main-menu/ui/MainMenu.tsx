'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from '@/shared/lib/auth-client';
import { MusicButton } from '@/src/shared/ui';
import { FC, useState } from 'react';
import Image from 'next/image';

interface MainMenuProps {
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const MainMenu: FC<MainMenuProps> = ({ isMusicPlaying, onToggleMusic }) => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isAuthenticated = Boolean(session);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === 'admin';

  const handleAuth = async () => {
    if (isAuthenticated) return;
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.refresh();
    setIsSigningOut(false);
  };


  return (
    <section className="flex flex-col text-center space-y-12 items-start gap-12">
      <div className='flex justify-between items-center w-full'>
        {isAuthenticated && (
          <div className="flex items-center gap-3 bg-zinc-800 border-2 border-zinc-700 px-3 py-2 backdrop-blur-sm">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Profile'}
                className="w-10 h-10 rounded-full border border-emerald-500 object-cover"
                width={40}
                height={40}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-emerald-500 bg-zinc-800 flex items-center justify-center text-emerald-400 text-xs font-bold">
                {session?.user?.name?.slice(0, 1).toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Профиль</div>
              <div className="text-sm text-zinc-200 font-bold">{session?.user?.name || 'Пользователь'}</div>

            </div>
            <Button
              variant='secondary'
              size='small'
              className='border-none !p-0'
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <svg className='w-5 h-5' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.2929 14.2929C16.9024 14.6834 16.9024 15.3166 17.2929 15.7071C17.6834 16.0976 18.3166 16.0976 18.7071 15.7071L21.6201 12.7941C21.6351 12.7791 21.6497 12.7637 21.6637 12.748C21.87 12.5648 22 12.2976 22 12C22 11.7024 21.87 11.4352 21.6637 11.252C21.6497 11.2363 21.6351 11.2209 21.6201 11.2059L18.7071 8.29289C18.3166 7.90237 17.6834 7.90237 17.2929 8.29289C16.9024 8.68342 16.9024 9.31658 17.2929 9.70711L18.5858 11H13C12.4477 11 12 11.4477 12 12C12 12.5523 12.4477 13 13 13H18.5858L17.2929 14.2929Z" fill="currentColor" />
                <path d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H14.5C15.8807 22 17 20.8807 17 19.5V16.7326C16.8519 16.647 16.7125 16.5409 16.5858 16.4142C15.9314 15.7598 15.8253 14.7649 16.2674 14H13C11.8954 14 11 13.1046 11 12C11 10.8954 11.8954 10 13 10H16.2674C15.8253 9.23514 15.9314 8.24015 16.5858 7.58579C16.7125 7.4591 16.8519 7.35296 17 7.26738V4.5C17 3.11929 15.8807 2 14.5 2H5Z" fill="currentColor" />
              </svg>
            </Button>
          </div>
        )}
        <MusicButton isPlaying={isMusicPlaying} onToggle={onToggleMusic} />
      </div>

      <div className="z-10 flex flex-col items-center gap-12 w-full">
        <Logo size='large' />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 w-full max-w-xs max-md:gap-2"
        >
          {!isAuthenticated ? (
            <Button onClick={handleAuth} disabled={isPending}>
              {isPending ? 'Проверка...' : 'Авторизоваться'}
            </Button>
          ) : (
            <Button onClick={() => router.push('/create')}>
              Играть
            </Button>
          )}

          {isAdmin && (
            <Button variant='secondary' size='small' onClick={() => router.push('/admin')}>
              Админка
            </Button>
          )}

          <Button variant='secondary' size='small' onClick={() => router.push('/authors')}>
            Об авторах
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
