/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useSocket } from '@/app/providers/socket-provider';

export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

export function useSocketEmit() {
  const { socket, ensureSocket, ensureSocketServer } = useSocket();

  const waitForConnection = (instance: Socket, timeoutMs: number): Promise<void> => {
    if (instance.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let completed = false;

      const cleanup = () => {
        instance.off('connect', handleConnect);
        instance.off('connect_error', handleConnectError);
      };

      const handleConnect = () => {
        if (completed) return;
        completed = true;
        window.clearTimeout(timeoutId);
        cleanup();
        resolve();
      };

      const handleConnectError = (error?: Error) => {
        if (completed) return;
        completed = true;
        window.clearTimeout(timeoutId);
        cleanup();
        reject(new Error(error?.message || 'Socket not connected'));
      };

      const timeoutId = window.setTimeout(() => {
        if (completed) return;
        completed = true;
        cleanup();
        reject(new Error('Socket not connected'));
      }, timeoutMs);

      instance.once('connect', handleConnect);
      instance.once('connect_error', handleConnectError);

      if (instance.connected) {
        handleConnect();
        return;
      }

      if (!instance.active) {
        instance.connect();
      }
    });
  };

  const emitWithAck = async <T = any>(instance: Socket, event: string, data: any): Promise<T> => {
    const ackTimeoutMs = 8000;
    const maxAttempts = 2;

    await ensureSocketServer();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await waitForConnection(instance, 10000);

        const response = await new Promise<any>((resolve, reject) => {
          instance.timeout(ackTimeoutMs).emit(event, data, (err: Error | null, ackResponse: any) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(ackResponse);
          });
        });

        if (response?.success) {
          return response.data as T;
        }

        throw new Error(response?.error || 'Unknown error');
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        if (!isLastAttempt) {
          continue;
        }

        const message = error instanceof Error ? error.message : '';
        if (message.includes('operation has timed out') || message.includes('Socket not connected')) {
          throw new Error('Сервер сокетов не ответил. Попробуйте перезагрузить страницу.');
        }

        throw error instanceof Error ? error : new Error('Unknown error');
      }
    }

    throw new Error('Сервер сокетов не ответил. Попробуйте перезагрузить страницу.');
  };

  return {
    emit: <T = any>(event: string, data: any): Promise<T> => {
      const instance = socket ?? ensureSocket();

      return emitWithAck<T>(instance, event, data);
    },
  };
}
