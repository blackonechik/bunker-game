'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui';
import { SystemLogPanelProps } from '../types';

export function SystemLogPanel({ messages, onSendMessage }: SystemLogPanelProps) {
  const [inputValue, setInputValue] = useState('');

  const visibleMessages = useMemo(() => messages.slice(-80), [messages]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) {
      return;
    }

    onSendMessage(trimmedMessage);
    setInputValue('');
  };

  return (
    <aside className="bg-zinc-900 border-2 border-zinc-800 p-4 relative overflow-hidden group h-[560px]">
      <div className="absolute top-0 right-0 p-1 bg-zinc-800 text-[10px] text-zinc-500">SYSTEM</div>
      <h2 className="text-orange-500 text-sm font-bold uppercase mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
        Логи системы
      </h2>

      <div className="space-y-3 h-[430px] overflow-y-auto pr-2 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-zinc-800">
        {visibleMessages.map((message, index) => (
          <p
            key={`${message.id}-${index}`}
            className={message.type === 'system' ? 'text-zinc-400' : 'text-green-500'}
          >
            {message.type === 'system'
              ? `> ${message.message}`
              : `> ${message.playerName || 'Игрок'}: ${message.message}`}
          </p>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            maxLength={200}
            placeholder="Отправить..."
            className="bg-black border border-zinc-700 text-xs p-2 w-full focus:outline-none focus:border-orange-500 transition-colors"
          />
          <Button type="submit" size="small" className="!px-3 !py-2 !text-xs !bg-orange-600 !border-orange-500 hover:!bg-orange-500 !text-black">
            ОТПРАВИТЬ
          </Button>
        </form>
      </div>
    </aside>
  );
}
