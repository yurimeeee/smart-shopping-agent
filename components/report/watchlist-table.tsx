'use client';

import { ArrowDownRight, Bookmark } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import type { FavoriteItem } from '@/lib/firestore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const won = (v: number) => `${v.toLocaleString('ko-KR')}`;

function ProductThumbnail({ product }: { product: FavoriteItem['product'] }) {
  const [failed, setFailed] = useState(false);
  const hue = product.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hasImage = product.image && !product.image.includes('placeholder') && !failed;

  if (hasImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={product.image} alt={product.name} className="size-full object-contain p-1.5" onError={() => setFailed(true)} />
    );
  }

  return (
    <div
      className="flex size-full items-center justify-center text-sm font-black opacity-25"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},30%,95%), hsl(${hue},45%,85%))`,
        color: `hsl(${hue},50%,30%)`,
      }}
    >
      {product.brand[0]}
    </div>
  );
}

export function WatchlistTable({ favorites }: { favorites: FavoriteItem[] }) {
  if (favorites.length === 0) {
    return (
      <Card className="gap-0 overflow-hidden rounded-xl border-zinc-200/70 py-0 shadow-none">
        <CardHeader className="border-b border-zinc-100 py-4">
          <CardTitle className="text-sm font-semibold">관심상품 가격 추적</CardTitle>
          <CardDescription className="text-xs">등록 시점 대비 할인 혜택과 AI 추천 지수를 확인합니다</CardDescription>
        </CardHeader>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="mb-2 size-8 text-zinc-200" />
          <p className="text-sm font-medium text-foreground">관심상품이 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">AI 추천 상품에서 북마크하면 여기에 표시됩니다</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border-zinc-200/70 py-0 shadow-none">
      <CardHeader className="border-b border-zinc-100 py-4">
        <CardTitle className="text-sm font-semibold">관심상품 가격 추적</CardTitle>
        <CardDescription className="text-xs">등록 시점 할인가와 AI 추천 지수를 확인합니다</CardDescription>
      </CardHeader>

      <div className="hidden grid-cols-[1fr_repeat(3,7rem)] gap-2 border-b border-zinc-100 px-4 py-2.5 text-[11px] font-medium text-muted-foreground md:grid">
        <span>상품</span>
        <span className="text-right">등록가</span>
        <span className="text-right">정가</span>
        <span className="text-right">AI 지수</span>
      </div>

      <ul className="divide-y divide-zinc-100">
        {favorites.map((f) => {
          const { product } = f;
          const hasDiscount = product.originalPrice && product.originalPrice > product.price;
          const discountPct = hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

          return (
            <li key={f.docId} className="grid grid-cols-2 items-center gap-2 px-4 py-3 md:grid-cols-[1fr_repeat(3,7rem)]">
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50">
                  <ProductThumbnail product={product} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{product.brand}</span>
                    {hasDiscount && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                        <ArrowDownRight className="size-3" />
                        {discountPct}% 할인
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground md:hidden">등록가 </span>
                <span className="font-mono text-sm font-semibold text-foreground">{won(product.price)}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground md:hidden">정가 </span>
                <span className={cn('font-mono text-xs', hasDiscount ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  {won(product.originalPrice ?? product.price)}
                </span>
              </div>

              <div className="hidden justify-end md:flex">
                <Badge variant="secondary" className="rounded-md bg-zinc-100 font-mono text-[11px] text-foreground">
                  {product.aiScore}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
