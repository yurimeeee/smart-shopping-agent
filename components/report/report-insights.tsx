import { Lightbulb, Sparkles, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReportInsight } from '@/lib/types'

const toneMeta = {
  positive: { Icon: Sparkles, iconClass: 'bg-zinc-900 text-zinc-50' },
  neutral: { Icon: Lightbulb, iconClass: 'bg-zinc-100 text-zinc-700' },
  warning: { Icon: TriangleAlert, iconClass: 'bg-zinc-100 text-zinc-700' },
} as const

export function ReportInsights({ insights }: { insights: ReportInsight[] }) {
  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-3.5" />
          AI 소비 인사이트
        </CardTitle>
        <CardDescription className="text-xs">
          관심상품과 소비 패턴을 분석한 제안입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const meta = toneMeta[insight.tone]
          return (
            <div
              key={insight.id}
              className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3"
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md',
                  meta.iconClass,
                )}
              >
                <meta.Icon className="size-3.5" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">{insight.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
