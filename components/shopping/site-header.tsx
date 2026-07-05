'use client';

import { LogOut, ShoppingBag } from 'lucide-react';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface SiteHeaderProps {
  active?: 'assistant' | 'report';
}

const navItems = [
  { key: 'assistant', label: '쇼핑 조수', href: '/' },
  { key: 'report', label: '소비 리포트', href: '/report' },
] as const;

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SiteHeader({ active = 'assistant' }: SiteHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <ShoppingBag className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">PickS</span>
        </Link>
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">탐색부터 비교까지, 당신의 쇼핑 가이드</span>
      </div>
      <nav className="flex items-center gap-1 text-xs">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'rounded-full px-3 py-1.5 font-medium transition-colors',
              active === item.key ? 'bg-zinc-100 text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
        <span className="ml-2 flex size-7 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-medium text-foreground">
          {getInitials(user?.displayName ?? null)}
        </span>
        <button
          onClick={handleLogout}
          className="ml-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground"
          title="로그아웃"
        >
          <LogOut className="size-3.5" />
        </button>
      </nav>
    </header>
  );
}
