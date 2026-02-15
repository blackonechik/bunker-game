'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/shared/ui/logo';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from '@/shared/lib/auth-client';

export function MainMenu() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === 'admin';

  const handleAuth = async () => {
    if (isAuthenticated) return;
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <section className="min-h-screen flex flex-col text-center space-y-12 items-start gap-12">
      {isAuthenticated && (
        <div className="m-0 z-20 flex items-center gap-3 bg-zinc-900/90 border border-zinc-700 px-3 py-2 backdrop-blur-sm">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name || 'Profile'}
              className="w-10 h-10 rounded-full border border-emerald-500 object-cover"
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
        </div>
      )}

      <div className="z-10 flex flex-col items-center gap-12 w-full">
        <Logo size='large' />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          {!isAuthenticated && (
            <Button onClick={handleAuth} disabled={isPending}>
              {isPending ? 'Проверка...' : 'Авторизоваться'}
            </Button>
          )}


          <Button onClick={() => router.push('/create')} disabled={!isAuthenticated || isPending}>
            Играть
          </Button>

          {isAdmin && (
            <Button variant='secondary' size='small' onClick={() => router.push('/admin')}>
              Админка
            </Button>
          )}

          {!isAuthenticated && (
            <p className="text-xs uppercase tracking-wide text-zinc-500">Сначала авторизуйтесь через Google</p>
          )}

          <Button variant='secondary' size='small' onClick={() => router.push('/authors')}>
            Об авторах
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
