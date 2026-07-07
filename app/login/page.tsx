'use client';

import { ShoppingBag, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (code === 'auth/too-many-requests') {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <ShoppingBag className="size-6" />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">PickS</h1>
            <p className="mt-1 text-sm text-muted-foreground">탐색부터 비교까지, 당신의 쇼핑 가이드</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="space-y-5">
            <p className="text-center text-xs text-muted-foreground">로그인하고 AI 쇼핑 가이드를 시작해 보세요.</p>

            {/* 이메일 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">이메일</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-foreground">비밀번호</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="비밀번호 입력"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password.trim()}
                className={cn(
                  'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
                  'bg-foreground text-background hover:opacity-80',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                )}
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                로그인
              </button>
            </form>

            {/* 구분선 */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">또는</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Google 로그인 */}
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
