'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/shared/lib/auth-client';

type Props = {
  children: React.ReactNode;
};

export function TelegramAutoAuthProvider({ children }: Props) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const requestedRef = useRef(false);

  const telegramInitData = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.Telegram?.WebApp?.initData ?? '';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  }, []);

  useEffect(() => {
    if (isPending || session || requestedRef.current) {
      return;
    }

    if (!telegramInitData) {
      return;
    }

    requestedRef.current = true;

    const authorize = async () => {
      try {
        const response = await fetch('/api/auth/telegram/miniapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ initData: telegramInitData }),
        });

        if (!response.ok) {
          requestedRef.current = false;
          return;
        }

        await authClient.getSession({
          query: {
            disableRefresh: true,
          },
        });

        router.refresh();
      } catch {
        requestedRef.current = false;
      }
    };

    void authorize();
  }, [isPending, router, session, telegramInitData]);

  return children;
}
