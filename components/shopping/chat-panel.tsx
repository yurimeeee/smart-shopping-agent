'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Link2, Loader2, Paperclip, Sparkles } from 'lucide-react';
import type { ChatMessage, ReasoningStep } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { createConversation, addMessage, getMessages, saveAnalysis, getAnalysis } from '@/lib/firestore';
import { useStore, type WorkspaceData } from '@/lib/store';
import type { ProductItem, ProductComparisonMatrix, ReviewSummary } from '@/lib/types';

const PRODUCT_KEYWORDS = [
  '추천',
  '비교',
  '상품',
  '제품',
  '뭐가 좋',
  '어떤 게',
  '어떤게',
  '어떤 거',
  '어떤거',
  '사야',
  '살까',
  '구매',
  '골라줘',
  '알려줘',
  '좋은 거',
  '좋은거',
  '리뷰',
  '인기',
  '베스트',
];

function isProductQuery(text: string): boolean {
  return PRODUCT_KEYWORDS.some((kw) => text.includes(kw));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkspaceData(raw: any): WorkspaceData {
  const products: ProductItem[] = (raw?.products ?? []).map((p: any) => ({
    ...p,
    image: p.image || '/placeholder.jpg',
    originalPrice: p.originalPrice > 0 ? p.originalPrice : undefined,
  }));

  const comparisonMatrix: ProductComparisonMatrix = raw.comparisonMatrix ?? {
    productIds: products.map((p) => p.id),
    specs: [],
  };

  const rs = raw.reviewSummary ?? { totalReviews: 0, positiveRatio: 0, positiveTags: [], negativeTags: [], oneLineSummary: '' };
  const reviewSummary: ReviewSummary = {
    ...rs,
    positiveTags: (rs.positiveTags ?? []).map((t: any) => ({ ...t, sentiment: 'positive' as const })),
    negativeTags: (rs.negativeTags ?? []).map((t: any) => ({ ...t, sentiment: 'negative' as const })),
  };

  return { title: raw.title ?? '', products, comparisonMatrix, reviewSummary };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function naverItemsToWorkspace(query: string, items: any[]): WorkspaceData {
  const products: ProductItem[] = items.map((item, i) => ({
    id: item.id || String(i),
    name: item.title,
    brand: item.brand,
    price: item.lprice,
    originalPrice: item.hprice > item.lprice ? item.hprice : undefined,
    image: item.image || '/placeholder.jpg',
    link: item.link,
    mallName: item.mallName,
    rating: 4.0,
    reviewCount: 0,
    shipping: '판매처 확인 필요',
    tags: [] as string[],
    pros: [] as string[],
    cons: [] as string[],
    aiScore: 0,
    recommended: i === 0,
  }));
  const productIds = products.map((p) => p.id);
  return {
    title: `"${query}" 검색 결과`,
    products,
    comparisonMatrix: { productIds, specs: [] },
    reviewSummary: {
      totalReviews: 0,
      positiveRatio: 0,
      positiveTags: [],
      negativeTags: [],
      oneLineSummary: 'AI 분석에 실패해 네이버 쇼핑 검색 결과를 표시합니다.',
    },
  };
}

function StepRow({ step }: { step: ReasoningStep }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
          step.status === 'done' && 'border-foreground bg-foreground text-background',
          step.status === 'active' && 'border-foreground text-foreground',
          step.status === 'pending' && 'border-zinc-200 text-zinc-300',
        )}
      >
        {step.status === 'done' ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : step.status === 'active' ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : (
          <span className="size-1 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight text-foreground">{step.label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{step.detail}</p>
      </div>
    </li>
  );
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-foreground px-4 py-2.5 text-sm leading-relaxed text-background">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-foreground">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="rounded-2xl rounded-tl-sm border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3">
          {message.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.content}
              {isStreaming && <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground align-middle" />}
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">분석 중...</span>
            </div>
          )}
        </div>
        {message.steps?.map ? (
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-background px-4 py-3.5">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground" />
              추론 단계
            </p>
            <ol className="space-y-3">
              {message.steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ChatPanelProps {
  userId: string;
  chatId: string | null;
  onChatCreate: (id: string) => void;
}

export function ChatPanel({ userId, chatId, onChatCreate }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const createdChatIdRef = useRef<string | null>(null);
  const { setWorkspace, setAnalyzing, setIsNewChat, tasteProfile } = useStore();

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  };

  // Load messages + workspace when chatId changes (external switch)
  useEffect(() => {
    if (chatId === null) {
      setMessages([]);
      setWorkspace(null);
      return;
    }
    if (chatId === createdChatIdRef.current) return;

    setIsNewChat(false);
    setMessages([]);
    Promise.all([getMessages(userId, chatId), getAnalysis(userId, chatId)]).then(([savedMsgs, analysis]) => {
      setMessages(savedMsgs.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: '' })));
      setWorkspace(analysis);
      requestAnimationFrame(scrollToBottom);
    });
  }, [chatId, userId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!value.trim() || isLoading) return;

    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const userContent = value.trim();
    setValue('');

    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: userContent, timestamp: now };
    const assistantMsg: ChatMessage = { id: `a${Date.now()}`, role: 'assistant', content: '', timestamp: now };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    // 1. chatId 먼저 확정
    let activeChatId = chatId;
    if (!activeChatId) {
      activeChatId = await createConversation(userId, userContent);
      createdChatIdRef.current = activeChatId;
      onChatCreate(activeChatId);
    }

    // 2. 유저 메시지 저장
    await addMessage(userId, activeChatId, 'user', userContent);

    // 3. chat 스트리밍 먼저 완료
    let fullResponse = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userContent }], tasteProfile }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? '오류가 발생했어요');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const text = decoder.decode(chunk, { stream: true });
        fullResponse += text;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + text,
          };
          return updated;
        });
      }

      await addMessage(userId, activeChatId, 'assistant', fullResponse);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : '응답을 가져오는 중 오류가 발생했어요.';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: errorText };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }

    // 4. chat 완료 후 워크스페이스 채우기
    const cid = activeChatId;
    setAnalyzing(true);
    try {
      if (isProductQuery(userContent)) {
        // 상품 쿼리 → products API 우선, 실패 시 Naver 폴백
        const r = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userContent, tasteProfile }),
        });
        const raw = await r.json().catch(() => ({}));

        if (!r.ok || raw.error || !raw.products?.length) {
          const sr = await fetch(`/api/search?q=${encodeURIComponent(userContent)}&display=10&sort=sim`);
          const sd = await sr.json().catch(() => ({ items: [] }));
          if (sd.items?.length > 0) {
            const ws = naverItemsToWorkspace(userContent, sd.items);
            setWorkspace(ws);
            await saveAnalysis(userId, cid, ws);
          }
          return;
        }

        const ws = toWorkspaceData(raw);
        setWorkspace(ws);
        await saveAnalysis(userId, cid, ws);
      } else {
        // 일반 쿼리 → products API 미호출, Naver 검색으로 바로 표시
        const sr = await fetch(`/api/search?q=${encodeURIComponent(userContent)}&display=10&sort=sim`);
        const sd = await sr.json().catch(() => ({ items: [] }));
        if (sd.items?.length > 0) {
          const ws = naverItemsToWorkspace(userContent, sd.items);
          setWorkspace(ws);
          await saveAnalysis(userId, cid, ws);
        }
      }
    } catch (e) {
      console.error('[workspace]', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastIsStreaming = isLoading && messages[messages.length - 1]?.role === 'assistant';

  return (
    <section className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
            <Sparkles className="size-4.5" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">AI 쇼핑 큐레이터</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              실시간 분석 중 · 온라인
            </p>
          </div>
        </div>
      </header>

      {/* Conversation */}
      <ScrollArea className="min-h-0 flex-1" ref={scrollAreaRef}>
        <div className="flex min-h-full flex-col px-5 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground">
                <Sparkles className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">무엇을 도와드릴까요?</p>
              <p className="mt-1 text-xs text-muted-foreground">상품 링크를 붙여넣거나 원하는 것을 말씀해 주세요</p>
            </div>
          ) : (
            <div className="mt-auto space-y-5">
              {messages.map((message, i) => (
                <MessageBubble key={message.id} message={message} isStreaming={lastIsStreaming && i === messages.length - 1} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 p-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-background p-2.5 transition-colors focus-within:border-foreground">
          <label htmlFor="chat-input" className="sr-only">
            메시지 입력
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="찾으시는 상품에 대해 말씀해 주세요."
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-zinc-400 disabled:opacity-50"
          />
          <div className="mt-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="파일 첨부">
                <Paperclip className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="링크 첨부">
                <Link2 className="size-4" />
              </Button>
            </div>
            <Button size="icon" className="size-8 rounded-lg" disabled={value.trim().length === 0 || isLoading} onClick={sendMessage} aria-label="전송">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </Button>
          </div>
        </div>
        <p className="mt-2 px-1 text-center text-[11px] text-zinc-400">PickS는 판매처와 독립적으로 소비자 관점에서 분석합니다.</p>
      </div>
    </section>
  );
}
