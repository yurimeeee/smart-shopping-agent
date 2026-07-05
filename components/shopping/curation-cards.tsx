'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Check, ExternalLink, Minus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  addFavorite,
  removeFavorite,
  subscribeFavorites,
  makeFavoriteDocId,
} from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import type { ProductItem } from '@/lib/types';

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function GradientPlaceholder({ product }: { product: ProductItem }) {
  const hue = product.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
      style={{ background: `linear-gradient(135deg, hsl(${hue},30%,95%), hsl(${hue},45%,85%))` }}
    >
      <div className="text-xl font-black opacity-40" style={{ color: `hsl(${hue},50%,30%)` }}>
        {product.brand[0]}
      </div>
      <p
        className="line-clamp-2 text-center text-[11px] font-medium leading-snug opacity-60"
        style={{ color: `hsl(${hue},50%,25%)` }}
      >
        {product.name}
      </p>
    </div>
  );
}

function ProductThumbnail({ product }: { product: ProductItem }) {
  const [failed, setFailed] = useState(false);
  const hasRealImage = product.image && !product.image.includes('placeholder') && !failed;

  if (hasRealImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={`${product.brand} ${product.name}`}
        className="absolute inset-0 size-full object-contain p-4"
        onError={() => setFailed(true)}
      />
    );
  }

  return <GradientPlaceholder product={product} />;
}

function ProductCard({
  product,
  isFavorited,
  favoriteDocId,
  onToggleFavorite,
}: {
  product: ProductItem;
  isFavorited: boolean;
  favoriteDocId: string | null;
  onToggleFavorite: (product: ProductItem, favoriteDocId: string | null) => void;
}) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-background transition-shadow hover:shadow-sm',
        product.recommended ? 'border-foreground' : 'border-zinc-200 dark:border-zinc-700',
      )}
    >
      <div className="relative h-44 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <ProductThumbnail product={product} />
        {product.recommended ? (
          <Badge className="absolute left-3 top-3 gap-1">
            <Star className="size-3 fill-current" />
            AI 1순위 추천
          </Badge>
        ) : null}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <button
            onClick={() => onToggleFavorite(product, favoriteDocId)}
            className={cn(
              'flex size-7 items-center justify-center rounded-full border transition-colors',
              isFavorited
                ? 'border-foreground bg-foreground text-background'
                : 'border-zinc-200 dark:border-zinc-700 bg-background/90 text-foreground backdrop-blur hover:border-foreground',
            )}
            title={isFavorited ? '관심상품 해제' : '관심상품 추가'}
          >
            {isFavorited ? (
              <BookmarkCheck className="size-3.5" />
            ) : (
              <Bookmark className="size-3.5" />
            )}
          </button>
          <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-background/90 px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground backdrop-blur">
            {product.aiScore}점
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-balance text-foreground">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>·</span>
          <span>리뷰 {formatPrice(product.reviewCount)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">장점</p>
            <ul className="space-y-1">
              {product.pros.map((pro) => (
                <li key={pro} className="flex items-start gap-1.5 text-xs leading-snug text-foreground">
                  <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-zinc-200/70 dark:border-zinc-700/70 pt-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-500">단점</p>
            <ul className="space-y-1">
              {product.cons.map((con) => (
                <li key={con} className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
                  <Minus className="mt-0.5 size-3 shrink-0 text-rose-400" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            {product.originalPrice ? (
              <p className="text-xs text-zinc-400 line-through">{formatPrice(product.originalPrice)}원</p>
            ) : null}
            <p className="text-lg font-bold tabular-nums text-foreground">
              {formatPrice(product.price)}
              <span className="text-sm font-medium">원</span>
            </p>
          </div>
          <a
            href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${product.brand} ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant={product.recommended ? 'default' : 'outline'} size="sm" className="gap-1.5 text-xs">
              상세 보기
              <ExternalLink className="size-3" />
            </Button>
          </a>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{product.shipping}</p>
      </div>
    </article>
  );
}

export function CurationCards({ products }: { products: ProductItem[] }) {
  const { user } = useAuth();
  // docId map: favoriteHash → firestoreDocId
  const [favoriteMap, setFavoriteMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, (items) => {
      const map: Record<string, string> = {};
      items.forEach((item) => {
        map[makeFavoriteDocId(item.product)] = item.docId;
      });
      setFavoriteMap(map);
    });
    return unsub;
  }, [user]);

  const handleToggle = async (product: ProductItem, favoriteDocId: string | null) => {
    if (!user) return;
    if (favoriteDocId) {
      await removeFavorite(user.uid, favoriteDocId);
    } else {
      await addFavorite(user.uid, product);
    }
  };

  const list = products;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((product) => {
        const hash = makeFavoriteDocId(product);
        const docId = favoriteMap[hash] ?? null;
        return (
          <ProductCard
            key={product.id}
            product={product}
            isFavorited={!!docId}
            favoriteDocId={docId}
            onToggleFavorite={handleToggle}
          />
        );
      })}
    </div>
  );
}
