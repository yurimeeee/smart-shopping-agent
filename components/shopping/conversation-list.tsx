'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react';
import { subscribeConversations, deleteConversation, type ConversationMeta } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  userId: string;
  currentChatId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
}

function ConversationItem({
  convo,
  isActive,
  userId,
  onSelect,
  onDelete,
}: {
  convo: ConversationMeta;
  isActive: boolean;
  userId: string;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    await deleteConversation(userId, convo.id);
    onDelete();
  };

  return (
    <li className="group relative">
      <button
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
          isActive && 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700',
        )}
      >
        <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate pr-5 text-xs font-medium text-foreground leading-snug">{convo.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {convo.updatedAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </button>

      {/* 쓰리도트 버튼 */}
      <div ref={menuRef} className="absolute right-1.5 top-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={cn(
            'flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-foreground',
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 z-50 min-w-[120px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background shadow-md">
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="size-3.5" />
              대화 삭제
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function ConversationList({ userId, currentChatId, isOpen, onToggle, onSelect, onNew, onDelete }: Props) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);

  useEffect(() => {
    const unsub = subscribeConversations(userId, setConversations);
    return unsub;
  }, [userId]);

  const handleDelete = (id: string) => {
    if (currentChatId === id) onDelete?.(id);
  };

  // 접힌 상태: 토글 버튼만 표시
  if (!isOpen) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-3 gap-2">
        <button
          onClick={onToggle}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-foreground"
          title="대화 목록 열기"
        >
          <PanelLeftOpen className="size-4" />
        </button>
        <button
          onClick={onNew}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-foreground"
          title="새 대화"
        >
          <Plus className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-3.5">
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-foreground"
            title="대화 목록 접기"
          >
            <PanelLeftClose className="size-4" />
          </button>
          <span className="text-xs font-semibold text-muted-foreground">대화 목록</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onNew}
          title="새 대화"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            아직 대화가 없어요
            <br />새 대화를 시작해 보세요
          </p>
        ) : (
          <ul className="space-y-0.5 px-2">
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                convo={c}
                isActive={currentChatId === c.id}
                userId={userId}
                onSelect={() => onSelect(c.id)}
                onDelete={() => handleDelete(c.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
