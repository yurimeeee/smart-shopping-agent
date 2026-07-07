'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2, MessageSquare, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const HIDDEN_PATHS = ['/', '/login'];

export function FloatingChat() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { tasteProfile } = useStore();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // 메인·로그인 페이지에서는 숨김
  if (HIDDEN_PATHS.includes(pathname) || !user) return null;

  const sendMessage = async () => {
    if (!value.trim() || isLoading) return;

    const userContent = value.trim();
    setValue('');

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: userContent };
    const assistantMsg: Message = { id: `a${Date.now()}`, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userContent }],
          tasteProfile,
        }),
      });

      if (!res.ok || !res.body) throw new Error('응답 오류');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const text = decoder.decode(chunk, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + text,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: '오류가 발생했어요. 다시 시도해주세요.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* 챗 패널 */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 flex flex-col w-[340px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-background shadow-2xl transition-all duration-200 origin-bottom-right',
          open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none',
        )}
        style={{ height: '460px' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">AI 쇼핑 큐레이터</p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                온라인
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Sparkles className="size-4 text-foreground" />
              </span>
              <p className="text-xs font-medium text-foreground">무엇이든 물어보세요</p>
              <p className="text-[11px] text-muted-foreground">상품 추천, 비교, 가격 분석을 도와드려요</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <span className="mr-2 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Sparkles className="size-3 text-foreground" />
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-foreground text-background'
                      : 'rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 text-foreground',
                  )}
                >
                  {msg.content || (
                    isLoading && i === messages.length - 1
                      ? <Loader2 className="size-3 animate-spin" />
                      : null
                  )}
                  {msg.role === 'assistant' && isLoading && i === messages.length - 1 && msg.content && (
                    <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-foreground align-middle" />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력 */}
        <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 p-3">
          <div className="flex items-end gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-2 focus-within:border-zinc-400 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="메시지를 입력하세요..."
              className="flex-1 resize-none bg-transparent text-xs leading-relaxed text-foreground outline-none placeholder:text-zinc-400 disabled:opacity-50 max-h-20"
            />
            <button
              onClick={sendMessage}
              disabled={!value.trim() || isLoading}
              className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-foreground text-background disabled:opacity-30 transition-opacity"
            >
              {isLoading ? <Loader2 className="size-3 animate-spin" /> : <ArrowUp className="size-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all duration-200 hover:scale-105 active:scale-95',
          open && 'rotate-90',
        )}
        aria-label="AI 쇼핑 큐레이터 열기"
      >
        {open ? <X className="size-5" /> : <MessageSquare className="size-5" />}
      </button>
    </>
  );
}
