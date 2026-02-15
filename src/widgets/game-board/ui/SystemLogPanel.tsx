'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui';
import { SystemLogPanelProps } from '../types';

export function SystemLogPanel({ messages, onSendMessage }: SystemLogPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <aside className={`bg-zinc-900 border-2 border-zinc-800 p-4 relative overflow-hidden group ${isCollapsed ? 'h-[60px]' : 'h-[560px]'}`}>
      <div className="absolute top-0 right-0 p-1 bg-zinc-800 text-[10px] text-zinc-500">SYSTEM</div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-orange-500 text-sm font-bold uppercase flex items-center gap-2">
          <span className={`w-2 h-2 bg-orange-500 rounded-full ${isCollapsed ? '' : 'animate-ping'}`} />
          Логи системы
        </h2>
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-[10px] uppercase tracking-wider border border-zinc-700 bg-black px-2 py-1 text-zinc-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          {isCollapsed ? 'Развернуть' : 'Свернуть'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="space-y-3 h-[430px] overflow-y-auto pr-2 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-zinc-800">
            {visibleMessages.map((message, index) => (
              <p
                key={`${message.id}-${index}`}
                className={message.type === 'system' ? 'text-zinc-400' : 'text-green-500 wrap-break-word whitespace-normal'}
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
              <Button type="submit" size="small" className="px-0.5! py-0! text-xs!">
                ОТПРАВИТЬ
              </Button>
            </form>
          </div>
        </>
      )}
    </aside>
  );
}
