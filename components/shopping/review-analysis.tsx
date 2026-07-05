import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ReviewSummary, SentimentTag } from '@/lib/types'

function TagPill({ tag }: { tag: SentimentTag }) {
  const isPositive = tag.sentiment === 'positive'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1 text-xs text-foreground">
      <span className={isPositive ? 'size-1.5 rounded-full bg-emerald-500' : 'size-1.5 rounded-full bg-rose-400'} />
      {tag.label}
      <span className="tabular-nums text-muted-foreground">{tag.count.toLocaleString('ko-KR')}</span>
    </span>
  )
}

export function ReviewAnalysis({ reviewSummary }: { reviewSummary: ReviewSummary }) {
  const { totalReviews, positiveRatio, positiveTags, negativeTags, oneLineSummary } = reviewSummary

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">리뷰 {totalReviews.toLocaleString('ko-KR')}건 감성 분석</span>
          <span className="tabular-nums text-muted-foreground">긍정 {positiveRatio}%</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full rounded-l-full bg-emerald-500" style={{ width: `${positiveRatio}%` }} />
          <div className="h-full flex-1 bg-rose-300 dark:bg-rose-800" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ThumbsUp className="size-3.5 text-emerald-600" />
            긍정 키워드
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {positiveTags.map((tag) => (
              <TagPill key={tag.label} tag={tag} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ThumbsDown className="size-3.5 text-rose-500" />
            아쉬운 점
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {negativeTags.map((tag) => (
              <TagPill key={tag.label} tag={tag} />
            ))}
          </div>
        </div>
      </div>

      <Alert className="rounded-2xl border-foreground/15 bg-zinc-50 dark:bg-zinc-900">
        <Sparkles className="size-4" />
        <AlertTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI 최종 한줄 요약
        </AlertTitle>
        <AlertDescription className="text-sm leading-relaxed text-pretty text-foreground">
          {oneLineSummary}
        </AlertDescription>
      </Alert>
    </div>
  )
}
