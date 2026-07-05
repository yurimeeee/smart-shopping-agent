import { Check, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ProductComparisonMatrix, ProductItem } from '@/lib/types'

interface Props {
  products: ProductItem[]
  comparisonMatrix: ProductComparisonMatrix
}

export function ComparisonTable({ products, comparisonMatrix }: Props) {
  const matrix = comparisonMatrix
  const productList = products

  const { productIds, specs } = matrix
  const columns = productIds
    .map((id) => productList.find((p) => p.id === id))
    .filter((p): p is ProductItem => Boolean(p))

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <th className="w-40 px-4 py-3.5 text-left align-bottom text-xs font-medium uppercase tracking-wide text-muted-foreground">
                항목
              </th>
              {columns.map((product) => (
                <th
                  key={product.id}
                  className={cn('px-4 py-3.5 text-left align-bottom', product.recommended && 'bg-foreground/5')}
                >
                  <div className="flex flex-col gap-1">
                    {product.recommended ? (
                      <Badge className="mb-0.5 w-fit gap-1">
                        <Crown className="size-3 fill-current" />
                        추천
                      </Badge>
                    ) : null}
                    <span className="text-xs font-normal text-muted-foreground">{product.brand}</span>
                    <span className="text-[13px] font-semibold leading-snug text-foreground">{product.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specs.map((spec) => (
              <tr
                key={spec.key}
                className={cn(
                  'border-b border-zinc-100 dark:border-zinc-800 last:border-0',
                  spec.key === 'score' && 'bg-zinc-50/60 dark:bg-zinc-900/60',
                )}
              >
                <td
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-muted-foreground',
                    spec.key === 'score' && 'text-foreground',
                  )}
                >
                  {spec.label}
                </td>
                {columns.map((product) => {
                  const isBest = spec.best === product.id
                  return (
                    <td
                      key={product.id}
                      className={cn('px-4 py-3 tabular-nums', product.recommended && 'bg-foreground/[0.03]')}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5',
                          spec.key === 'score'
                            ? 'text-sm font-bold text-foreground'
                            : 'text-[13px] text-foreground',
                          isBest && spec.key !== 'score' && 'font-semibold',
                        )}
                      >
                        {spec.values[product.id]}
                        {isBest ? <Check className="size-3.5 text-emerald-600" strokeWidth={3} /> : null}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
