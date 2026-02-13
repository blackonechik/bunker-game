'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  ensureSocket: () => Socket;
  ensureSocketServer: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  ensureSocket: () => {
    throw new Error('Socket provider is not initialized');
  },
  ensureSocketServer: async () => {
    throw new Error('Socket provider is not initialized');
  },
});

let socketInstance: Socket | null = null;
let socketServerInitPromise: Promise<void> | null = null;

async function initializeSocketServerIfNeeded() {
  if (!socketServerInitPromise) {
    socketServerInitPromise = fetch('/api/socket', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Socket init failed: ${response.status}`);
      }
    });
  }

  return socketServerInitPromise;
}

function createSocketInstance() {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket-io',
      addTrailingSlash: false,
      withCredentials: true,
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      autoConnect: false,
    });
  }

  return socketInstance;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);

  const shouldKeepSocketConnected = pathname?.startsWith('/lobby/') || pathname?.startsWith('/game/');

  const ensureSocket = useCallback(() => {
    return createSocketInstance();
  }, []);

  const ensureSocketServer = useCallback(async () => {
    await initializeSocketServerIfNeeded();
  }, []);

  useEffect(() => {
    if (!shouldKeepSocketConnected) {
      return;
    }

    const instance = ensureSocket();

    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);

    const syncTimer = window.setTimeout(() => {
      setIsConnected(instance.connected);
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
    };
  }, [ensureSocket, shouldKeepSocketConnected]);

  useEffect(() => {
    if (shouldKeepSocketConnected) {
      const instance = ensureSocket();
      let cancelled = false;

      const connect = async () => {
        try {
          await ensureSocketServer();
          if (cancelled) {
            return;
          }

          if (!instance.connected && !instance.active) {
            instance.connect();
          }
        } catch (error) {
          console.error('Socket init error:', error);
        }
      };

      connect();

      return () => {
        cancelled = true;
      };
    }

    if (socketInstance && (socketInstance.connected || socketInstance.active)) {
      socketInstance.disconnect();
    }
  }, [ensureSocket, ensureSocketServer, shouldKeepSocketConnected]);

  const contextValue = useMemo(
    () => ({
      socket: socketInstance,
      isConnected,
      ensureSocket,
      ensureSocketServer,
    }),
    [ensureSocket, ensureSocketServer, isConnected]
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
