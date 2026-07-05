'use client';

import { LayoutGrid, Loader2, MessageSquareText, Table2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ComparisonTable } from './comparison-table';
import { CurationCards } from './curation-cards';
import { ReviewAnalysis } from './review-analysis';
import { SecondaryGrid } from './secondary-grid';
import { useStore } from '@/lib/store';

function BlockHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function WorkspacePanel() {
  const { workspace, isAnalyzing, isNewChat } = useStore();

  const noData = workspace === null;
  const title = workspace?.title ?? '분석 워크스페이스';
  const productCount = workspace?.products.length ?? 0;

  return (
    <section className="flex h-full min-h-0 flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
      <header className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-background px-6 py-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">실시간 추천·비교</p>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {/* {isAnalyzing ? (
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            분석 중...
          </span>
        ) : !noData ? (
          <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1 text-xs text-muted-foreground">
            {`상품 ${productCount}개 분석 완료`}
          </span>
        ) : null} */}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="mb-3 size-6 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">상품 분석 중...</p>
            <p className="mt-1 text-xs text-muted-foreground">가격, 스펙, 리뷰를 종합하고 있어요</p>
          </div>
        ) : noData ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <LayoutGrid className="size-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-foreground">여기에 분석 결과가 표시됩니다</p>
            <p className="mt-1 text-xs text-muted-foreground">질문을 시작하면 제품 비교와 추천 리포트가 생성됩니다.</p>
          </div>
        ) : (
          <Tabs defaultValue="curation" className="gap-5">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="curation" className="flex-none px-3">
                <LayoutGrid className="hidden sm:block size-4" />
                큐레이션 추천
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex-none px-3">
                <Table2 className="hidden sm:block size-4" />
                비교 · 구매 판단
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-none px-3">
                <MessageSquareText className="hidden sm:block size-4" />
                리뷰 요약
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curation">
              <BlockHeading title="상황 기반 큐레이션 & 추천" description="요청에 맞춰 AI가 선별한 제품입니다." />
              <CurationCards products={workspace.products} />
            </TabsContent>

            <TabsContent value="compare">
              <BlockHeading title="상품 비교 및 구매 판단 테이블" description="가격·배송·핵심 스펙과 AI 종합 구매 추천 지수를 한눈에 비교하세요." />
              <ComparisonTable products={workspace.products} comparisonMatrix={workspace.comparisonMatrix} />
            </TabsContent>

            <TabsContent value="reviews">
              <BlockHeading title="리뷰 요약 및 감성 분석" description="수천 건의 리뷰를 긍정·부정 키워드로 압축했습니다." />
              <ReviewAnalysis reviewSummary={workspace.reviewSummary} />
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-8 border-t border-zinc-200 pt-8">
          <SecondaryGrid />
        </div>
      </div>
    </section>
  );
}
