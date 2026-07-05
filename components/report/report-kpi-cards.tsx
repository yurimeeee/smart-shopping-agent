import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReportKpi } from '@/lib/types'

export function ReportKpiCards({ kpis }: { kpis: ReportKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const TrendIcon =
          kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus
        return (
          <Card key={kpi.id} className="gap-0 rounded-xl border-zinc-200/70 p-4 shadow-none">
            <span className="text-xs text-muted-foreground">{kpi.label}</span>
            <span className="mt-2 font-mono text-xl font-semibold tracking-tight text-foreground">
              {kpi.value}
            </span>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                  kpi.positive ? 'bg-zinc-900 text-zinc-50' : 'bg-zinc-100 text-zinc-600',
                )}
              >
                <TrendIcon className="size-3" />
                {kpi.delta}
              </span>
              <span className="text-[11px] text-muted-foreground">{kpi.hint}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
