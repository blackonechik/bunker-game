'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/shared/lib/auth-client';
import { RoomState } from '@/shared/types';
import { showNotification } from '@/src/shared/ui';
import {
  getTelegramStartParamFromLocation,
  parseRoomCodeFromStartParam,
} from '@/src/shared/lib/telegram-miniapp-link';

type Props = {
  children: React.ReactNode;
};

export function TelegramAutoAuthProvider({ children }: Props) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const requestedRef = useRef(false);
  const startParamHandledRef = useRef(false);
  const [telegramInitData, setTelegramInitData] = useState('');
  const [startParam, setStartParam] = useState('');

  useEffect(() => {
    const fromLocation = getTelegramStartParamFromLocation();

    if (fromLocation) {
      setStartParam(fromLocation);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let attempts = 0;
    const maxAttempts = 300;

    const syncTelegramState = () => {
      const webApp = window.Telegram?.WebApp;

      if (!webApp) {
        return false;
      }

      webApp.ready?.();
      webApp.expand?.();

      if (webApp.initData) {
        setTelegramInitData((prev) => prev || webApp.initData || '');
      }

      const startParamFromWebApp = webApp.initDataUnsafe?.start_param;
      if (startParamFromWebApp) {
        setStartParam((prev) => prev || startParamFromWebApp);
      }

      return Boolean(webApp.initData);
    };

    syncTelegramState();

    const onFocus = () => {
      syncTelegramState();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTelegramState();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      attempts += 1;
      const hasInitData = syncTelegramState();

      if (hasInitData || attempts >= maxAttempts) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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

        window.location.reload();
      } catch {
        requestedRef.current = false;
      }
    };

    void authorize();
  }, [isPending, router, session, telegramInitData]);

  useEffect(() => {
    if (startParamHandledRef.current || !session || isPending) {
      return;
    }

    const roomCode = parseRoomCodeFromStartParam(startParam);
    if (!roomCode) {
      return;
    }

    startParamHandledRef.current = true;

    const routeByRoomState = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          showNotification.error('Игра завершена', 'Комната уже завершена или неактивна');
          router.replace('/');
          return;
        }

        const payload = (await response.json()) as {
          success?: boolean;
          data?: { room?: { state?: RoomState } };
        };

        const roomState = payload.data?.room?.state;

        if (!payload.success || !roomState || roomState === RoomState.FINISHED) {
          showNotification.error('Игра завершена', 'Комната уже завершена или неактивна');
          router.replace('/');
          return;
        }

        if (roomState === RoomState.WAITING) {
          router.replace(`/lobby/${roomCode}`);
          return;
        }

        router.replace(`/game/${roomCode}`);
      } catch {
        showNotification.error('Ошибка', 'Не удалось открыть приглашение');
      }
    };

    void routeByRoomState();
  }, [isPending, router, session, startParam]);

  return children;
}
