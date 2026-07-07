'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Heart, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { SiteHeader } from '@/components/shopping/site-header';
import { useAuth } from '@/lib/auth-context';
import { addFavorite, removeFavorite, subscribeFavorites, makeFavoriteDocId } from '@/lib/firestore';
import type { ProductItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NaverItem {
  id: string;
  title: string;
  link: string;
  image: string;
  lprice: number;
  hprice: number;
  mallName: string;
  brand: string;
  category1: string;
  category2: string;
}

type SortKey = 'sim' | 'asc' | 'dsc' | 'date';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'sim', label: '관련순' },
  { key: 'asc', label: '가격 낮은순' },
  { key: 'dsc', label: '가격 높은순' },
  { key: 'date', label: '최신순' },
];

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR');
}

function naverToProduct(item: NaverItem): ProductItem {
  return {
    id: item.id,
    name: item.title,
    brand: item.brand,
    price: item.lprice,
    originalPrice: item.hprice > item.lprice ? item.hprice : undefined,
    image: item.image,
    link: item.link,
    mallName: item.mallName,
    rating: 0,
    reviewCount: 0,
    shipping: '',
    tags: [],
    pros: [],
    cons: [],
    aiScore: 0,
  };
}

function ProductCard({ item, isFavorited, onToggleFavorite }: { item: NaverItem; isFavorited: boolean; onToggleFavorite: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background transition-shadow hover:shadow-md"
    >
      {/* 이미지 */}
      <div className="relative aspect-square bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
        {item.image && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            className="absolute inset-0 size-full object-contain p-3 transition-transform duration-200 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-zinc-200 dark:text-zinc-700">
              {item.brand?.[0] ?? '?'}
            </span>
          </div>
        )}
        {/* 쇼핑몰 뱃지 */}
        <span className="absolute bottom-2 left-2 rounded-full bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-zinc-200 dark:border-zinc-700">
          {item.mallName}
        </span>
        {/* 관심상품 토글 */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
          className={cn(
            'absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-zinc-200 dark:border-zinc-700 transition-colors',
            isFavorited ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-400',
          )}
          title={isFavorited ? '관심상품 해제' : '관심상품 등록'}
        >
          <Heart className={cn('size-3.5 transition-all', isFavorited && 'fill-rose-500')} />
        </button>
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {item.brand && (
          <p className="text-[11px] text-muted-foreground truncate">{item.brand}</p>
        )}
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{item.title}</p>
        {item.category2 && (
          <p className="text-[10px] text-muted-foreground">{item.category2}</p>
        )}
        <div className="mt-auto pt-2">
          {item.hprice > item.lprice && (
            <p className="text-[10px] text-zinc-400 line-through">{formatPrice(item.hprice)}원</p>
          )}
          <p className="text-sm font-bold text-foreground">
            {formatPrice(item.lprice)}<span className="text-xs font-medium">원</span>
          </p>
        </div>
      </div>

      {/* 호버 오버레이 */}
      <div className="flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800 px-3 py-2 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <ExternalLink className="size-3" />
        구매하러 가기
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-background animate-pulse">
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-2.5 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-2.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-2.5 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>('sim');
  const [items, setItems] = useState<NaverItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [favoriteMap, setFavoriteMap] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, (favItems) => {
      const map: Record<string, string> = {};
      favItems.forEach((fav) => {
        map[makeFavoriteDocId(fav.product)] = fav.docId;
      });
      setFavoriteMap(map);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!query.trim()) { setItems([]); setTotal(0); return; }
    setIsFetching(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${sort}&display=20`)
      .then((r) => r.json())
      .then((data) => { setItems(data.items ?? []); setTotal(data.total ?? 0); })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [query, sort]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setQuery(q);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  const toggleFavorite = async (item: NaverItem) => {
    if (!user) return;
    const product = naverToProduct(item);
    const key = makeFavoriteDocId(product);
    const firestoreDocId = favoriteMap[key];
    if (firestoreDocId) {
      await removeFavorite(user.uid, firestoreDocId);
    } else {
      await addFavorite(user.uid, product);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader active="search" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-4 py-2.5 focus-within:border-zinc-400 transition-colors">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="상품명, 브랜드, 카테고리 검색..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400"
              autoFocus
            />
            {inputValue && (
              <button type="button" onClick={() => { setInputValue(''); inputRef.current?.focus(); }}
                className="text-zinc-400 hover:text-foreground transition-colors text-xs">✕</button>
            )}
          </div>
          <button type="submit"
            className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-80 transition-opacity">
            검색
          </button>
        </form>

        {/* 결과 헤더 */}
        {(query && !isFetching) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">"{query}"</span> 검색 결과
              {total > 0 && <> · 약 {total.toLocaleString()}개</>}
            </p>
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setSort(opt.key)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    sort === opt.key
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 결과 그리드 */}
        <div className="mt-4">
          {isFetching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => {
              const product = naverToProduct(item);
              const key = makeFavoriteDocId(product);
              return (
                <ProductCard
                  key={item.id || item.link}
                  item={item}
                  isFavorited={!!favoriteMap[key]}
                  onToggleFavorite={() => toggleFavorite(item)}
                />
              );
            })}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="mb-3 size-8 text-zinc-300" />
              <p className="text-sm font-medium text-foreground">검색 결과가 없어요</p>
              <p className="mt-1 text-xs text-muted-foreground">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="mb-3 size-8 text-zinc-300" />
              <p className="text-sm font-medium text-foreground">찾고 싶은 상품을 검색해보세요</p>
              <p className="mt-1 text-xs text-muted-foreground">네이버 쇼핑 실시간 검색 결과를 보여드려요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
