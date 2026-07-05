import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { CategorySpend } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

export function CategoryBreakdown({ data }: { data: CategorySpend[] }) {
  const total = data.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">카테고리별 관심 소비</CardTitle>
        <CardDescription className="text-xs">
          {total > 0 ? `총 ${total.toLocaleString('ko-KR')} · 상위 카테고리 분포` : '관심상품을 저장하면 카테고리 분포가 표시됩니다'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">데이터가 없어요</p>
        ) : (
          data.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{cat.category}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-foreground">{cat.amount.toLocaleString('ko-KR')}</span>
                  <span className="w-9 text-right text-muted-foreground">{cat.share}%</span>
                </span>
              </div>
              <Progress value={cat.share} className="h-2 bg-zinc-100" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
