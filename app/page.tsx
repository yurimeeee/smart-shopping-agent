'use client';

import { LogOut, MessageSquare, Moon, PanelLeftOpen, ShoppingBag, Sparkles, Sun, UserCircle2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatPanel } from '@/components/shopping/chat-panel';
import { ConversationList } from '@/components/shopping/conversation-list';
import { WorkspacePanel } from '@/components/shopping/workspace-panel';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

type MobileTab = 'chat' | 'workspace';

export default function Page() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { currentChatId, setCurrentChatId, setIsNewChat, theme, toggleTheme } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // 패널 드래그 리사이즈
  const mainRef = useRef<HTMLDivElement>(null);
  const [chatWidthPx, setChatWidthPx] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const chatWidthRef = useRef(chatWidthPx);
  useEffect(() => {
    chatWidthRef.current = chatWidthPx;
  }, [chatWidthPx]);

  useEffect(() => {
    if (!mainRef.current) return;
    const sidebarW = sidebarOpen ? 220 : 48;
    const available = mainRef.current.clientWidth - sidebarW;
    if (available > 600) setChatWidthPx(Math.round(available * 0.4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = chatWidthRef.current;
      setIsDragging(true);

      const onMove = (ev: MouseEvent) => {
        if (!mainRef.current) return;
        const sidebarW = sidebarOpen ? 220 : 48;
        const available = mainRef.current.clientWidth - sidebarW;
        const next = startWidth + (ev.clientX - startX);
        setChatWidthPx(Math.min(Math.max(next, 280), available - 280));
      };

      const onUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [sidebarOpen],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setIsNewChat(true);
    setMobileSidebarOpen(false);
    setMobileTab('chat');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setIsNewChat(false);
    setMobileSidebarOpen(false);
    setMobileTab('chat');
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Global top bar */}
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground lg:hidden"
            title="대화 목록"
          >
            <PanelLeftOpen className="size-4" />
          </button>
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <ShoppingBag className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">PickS</span>
        </div>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <a href="/" className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-foreground whitespace-nowrap">
            쇼핑 큐레이터
          </a>
          <a href="/search" className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
            상품 검색
          </a>
          <a href="/wishlist" className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
            관심상품
          </a>
          <a href="/report" className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
            소비 리포트
          </a>
          <button
            onClick={toggleTheme}
            className="ml-1 flex size-7 items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground text-muted-foreground"
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
          <div ref={profileRef} className="relative ml-1">
            <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center rounded-full transition-opacity hover:opacity-70">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName ?? ''} className="size-7 rounded-full object-cover" />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-foreground">
                  {user.displayName?.[0] ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background shadow-lg">
                <div className="border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-foreground">{user.displayName ?? '사용자'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                </div>
                <a
                  href="/mypage/taste"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs text-foreground transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <UserCircle2 className="size-3.5 text-muted-foreground" />
                  나의 취향 프로필
                </a>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-rose-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <LogOut className="size-3.5" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Desktop: flex with resizable panels */}
      <main ref={mainRef} className={cn('hidden min-h-0 flex-1 lg:flex', isDragging && 'cursor-ew-resize select-none')}>
        {/* 사이드바 */}
        <div className="min-h-0 shrink-0 overflow-hidden border-r border-zinc-100 dark:border-zinc-800 transition-[width] duration-200" style={{ width: sidebarOpen ? 220 : 48 }}>
          <ConversationList
            userId={user.uid}
            currentChatId={currentChatId}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            onSelect={(id) => {
              setCurrentChatId(id);
              setIsNewChat(false);
            }}
            onNew={handleNewChat}
            onDelete={handleNewChat}
          />
        </div>

        {/* 채팅 패널 */}
        <div className="min-h-0 shrink-0 overflow-hidden" style={{ width: chatWidthPx }}>
          <ChatPanel userId={user.uid} chatId={currentChatId} onChatCreate={setCurrentChatId} />
        </div>

        {/* 드래그 핸들 */}
        <div onMouseDown={handleDragStart} className="group relative z-10 w-1 shrink-0 cursor-ew-resize">
          <div className={cn('absolute inset-y-0 -left-1 -right-1 transition-colors', isDragging ? 'bg-blue-500/20' : 'hover:bg-blue-500/10')} />
          <div className={cn('absolute inset-y-0 left-0 w-px transition-colors', isDragging ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700 group-hover:bg-blue-400')} />
          {/* 그립 도트 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            ))}
          </div>
        </div>

        {/* 워크스페이스 패널 */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <WorkspacePanel />
        </div>
      </main>

      {/* Mobile: single panel + bottom tabs */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === 'chat' ? <ChatPanel userId={user.uid} chatId={currentChatId} onChatCreate={setCurrentChatId} /> : <WorkspacePanel />}
        </div>

        {/* Bottom tab bar */}
        <div className="flex shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-background pb-safe">
          <button
            onClick={() => setMobileTab('chat')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
              mobileTab === 'chat' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <MessageSquare className="size-5" />
            채팅
          </button>
          <button
            onClick={() => setMobileTab('workspace')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
              mobileTab === 'workspace' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Sparkles className="size-5" />
            추천·비교
          </button>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl lg:hidden">
            <ConversationList
              userId={user.uid}
              currentChatId={currentChatId}
              isOpen={true}
              onToggle={() => setMobileSidebarOpen(false)}
              onSelect={handleSelectChat}
              onNew={handleNewChat}
              onDelete={handleNewChat}
            />
          </div>
        </>
      )}
    </div>
  );
}
