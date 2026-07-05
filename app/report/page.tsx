'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CategoryBreakdown } from '@/components/report/category-breakdown';
import { ReportInsights } from '@/components/report/report-insights';
import { ReportKpiCards } from '@/components/report/report-kpi-cards';
import { SiteHeader } from '@/components/shopping/site-header';
import { SpendTrendChart } from '@/components/report/spend-trend-chart';
import { WatchlistTable } from '@/components/report/watchlist-table';
import { useAuth } from '@/lib/auth-context';
import { subscribeFavorites, subscribeConversations, type FavoriteItem } from '@/lib/firestore';
import {
  computeKpis,
  computeMonthlySpend,
  computeCategorySpend,
  computeInsights,
} from '@/lib/report-utils';
import type { ReportKpi, MonthlySpendPoint, CategorySpend, ReportInsight } from '@/lib/types';

const CURRENT_MONTH = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

export default function ReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [chatWithAnalysis, setChatWithAnalysis] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let favUnsub: (() => void) | undefined;
    let chatUnsub: (() => void) | undefined;

    favUnsub = subscribeFavorites(user.uid, (items) => {
      setFavorites(items);
      setDataLoading(false);
    });

    chatUnsub = subscribeConversations(user.uid, (convos) => {
      setChatCount(convos.length);
    });

    return () => {
      favUnsub?.();
      chatUnsub?.();
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  const kpis: ReportKpi[] = computeKpis(favorites, chatCount, chatWithAnalysis);
  const monthlySpend: MonthlySpendPoint[] = computeMonthlySpend(favorites);
  const categorySpend: CategorySpend[] = computeCategorySpend(favorites);
  const insights: ReportInsight[] = computeInsights(favorites, categorySpend);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader active="report" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground">
              내 관심상품 소비 리포트
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              관심상품과 대화 기록을 기반으로 한 소비 패턴 분석입니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-zinc-200 text-xs font-medium"
            >
              <Calendar className="size-3.5" />
              {CURRENT_MONTH}
            </Button>
          </div>
        </div>

        {dataLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <ReportKpiCards kpis={kpis} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <SpendTrendChart data={monthlySpend} />
              <CategoryBreakdown data={categorySpend} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <WatchlistTable favorites={favorites} />
              <ReportInsights insights={insights} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
