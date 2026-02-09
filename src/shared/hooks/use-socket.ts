/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
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
  const { socket } = useSocket();

  return {
    emit: <T = any>(event: string, data: any): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit(event, data, (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Unknown error'));
          }
        });
      });
    },
  };
}
