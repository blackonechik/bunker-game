'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

let socketInstance: Socket | null = null;

function getSocketInstance() {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
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
      autoConnect: true,
    });
  }

  return socketInstance;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(getSocketInstance().connected);

  useEffect(() => {
    const instance = getSocketInstance();

    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);

    if (!instance.connected && !instance.active) {
      instance.connect();
    }

    return () => {
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: getSocketInstance(),
      isConnected,
    }),
    [isConnected]
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
