'use client';

import { LogOut, Moon, ShoppingBag, Sun, UserCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

type ActivePage = 'assistant' | 'wishlist' | 'report' | 'search';

interface SiteHeaderProps {
  active?: ActivePage;
  rightSlot?: React.ReactNode;
}

const navItems: { key: ActivePage; label: string; href: string }[] = [
  { key: 'assistant', label: '쇼핑 큐레이터', href: '/' },
  { key: 'search', label: '상품 검색', href: '/search' },
  { key: 'wishlist', label: '관심상품', href: '/wishlist' },
  { key: 'report', label: '소비 리포트', href: '/report' },
];

export function SiteHeader({ active, rightSlot }: SiteHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useStore();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-background/95 backdrop-blur px-6 py-3">
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
          <ShoppingBag className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">PickS</span>
      </Link>

      {/* 네비게이션 */}
      <nav className="flex items-center gap-0.5 sm:gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap',
              active === item.key ? 'bg-zinc-100 dark:bg-zinc-800 text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}

        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className="ml-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
          title={theme === 'light' ? '다크 모드' : '라이트 모드'}
        >
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>

        {/* 프로필 드롭다운 */}
        <div ref={profileRef} className="relative ml-1">
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center rounded-full transition-opacity hover:opacity-70">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt={user.displayName ?? ''} className="size-7 rounded-full object-cover" />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-foreground">
                {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background shadow-lg">
                <div className="border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-foreground">{user?.displayName ?? '사용자'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                </div>
                <Link
                  href="/mypage/taste"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs text-foreground transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <UserCircle2 className="size-3.5 text-muted-foreground" />
                  나의 취향 프로필
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-rose-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <LogOut className="size-3.5" />
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
        {rightSlot && <div className="ml-2 hidden sm:block border-l border-zinc-200 dark:border-zinc-700 pl-2">{rightSlot}</div>}
      </nav>
    </header>
  );
}
