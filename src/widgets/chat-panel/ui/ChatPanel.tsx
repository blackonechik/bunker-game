'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessageDTO } from '@/shared/types';

interface ChatPanelProps {
  messages: ChatMessageDTO[];
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="bg-black border-2 border-zinc-800 h-full min-h-[400px] flex flex-col">
      {/* Заголовок */}
      <div className="text-xs font-black uppercase text-zinc-600 border-b border-zinc-800 p-4">
        Transmission Log
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[11px] font-mono">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              {msg.type === 'system' ? (
                <>
                  <span className="text-amber-500">[SYSTEM]:</span>
                  <span className="text-zinc-400 italic">{msg.message}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400">{msg.playerName}:</span>
                  <span className="text-zinc-200 uppercase tracking-tight">
                    {msg.message}
                  </span>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={200}
          placeholder="Type message..."
          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
        />
      </form>
    </div>
  );
}
