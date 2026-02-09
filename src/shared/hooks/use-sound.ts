/* eslint-disable react-hooks/refs */
'use client';

import { useRef, useCallback } from 'react';

export function useSound() {
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const confirmAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация аудио элементов
  if (typeof window !== 'undefined') {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio('/audio/click.mp3');
      clickAudioRef.current.volume = 0.4;
    }
    if (!confirmAudioRef.current) {
      confirmAudioRef.current = new Audio('/audio/confirmation.mp3');
      confirmAudioRef.current.volume = 0.2;
    }
    if (!errorAudioRef.current) {
      errorAudioRef.current = new Audio('/audio/reject-notification.mp3');
      errorAudioRef.current.volume = 0.5;
    }
    if (!notificationAudioRef.current) {
      notificationAudioRef.current = new Audio('/audio/interface-hint-notification.mp3');
      notificationAudioRef.current.volume = 0.4;
    }
  }

  const playClick = useCallback(() => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }
  }, []);

  const playConfirmation = useCallback(() => {
    if (confirmAudioRef.current) {
      confirmAudioRef.current.currentTime = 0;
      confirmAudioRef.current.play().catch(() => {});
    }
  }, []);

  const playError = useCallback(() => {
    if (errorAudioRef.current) {
      errorAudioRef.current.currentTime = 0;
      errorAudioRef.current.play().catch(() => {});
    }
  }, []);

  const playNotification = useCallback(() => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch(() => {});
    }
  }, []);

  return {
    playClick,
    playConfirmation,
    playError,
    playNotification,
  };
}
