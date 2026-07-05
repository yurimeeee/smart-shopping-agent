'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { MonthlySpendPoint } from '@/lib/types'

const chartConfig = {
  interest: {
    label: '관심 소비',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const formatWon = (value: number) =>
  value === 0 ? '₩0' : `₩${(value / 10000).toFixed(0)}만`

export function SpendTrendChart({ data }: { data: MonthlySpendPoint[] }) {
  const hasData = data.some((d) => d.interest > 0)

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">월별 관심 소비 추이</CardTitle>
        <CardDescription className="text-xs">
          관심상품 등록 기준 월별 누적 금액 (최근 6개월)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-interest)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-interest)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-[11px]"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={formatWon}
                  className="text-[11px]"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`₩${Number(value).toLocaleString('ko-KR')}`, '관심 소비']}
                    />
                  }
                />
                <Area
                  dataKey="interest"
                  type="monotone"
                  stroke="var(--color-interest)"
                  fill="url(#fillInterest)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            <div className="mt-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: 'var(--chart-3)' }} />
                관심 소비
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-foreground">아직 데이터가 없어요</p>
              <p className="mt-1 text-xs text-muted-foreground">관심상품을 저장하면 추이가 표시됩니다</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
