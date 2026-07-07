'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Heart, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeFavorites, removeFavorite, type FavoriteItem } from '@/lib/firestore';
import { SiteHeader } from '@/components/shopping/site-header';
import { cn } from '@/lib/utils';
import type { ProductItem } from '@/lib/types';

function detectCategory(product: ProductItem): string {
  const text = [product.name, product.brand, ...product.tags].join(' ').toLowerCase();
  if (/텐트|캠핑|아웃도어|등산|트레킹|백패킹|랜턴|버너|체어|타프/.test(text)) return '캠핑·아웃도어';
  if (/가전|디지털|노트북|스마트폰|태블릿|이어폰|tv|모니터|키보드|마우스|it|테크/.test(text)) return '가전·디지털';
  if (/홈|인테리어|리빙|주방|침구|가구|조명|커튼|러그/.test(text)) return '홈·리빙';
  if (/패션|의류|신발|가방|시계|액세서리|무신사|청바지/.test(text)) return '패션·잡화';
  if (/뷰티|화장품|스킨케어|향수|샴푸|로션|선크림/.test(text)) return '뷰티·헬스';
  if (/식품|음식|커피|차|영양제|단백질|프로틴/.test(text)) return '식품·건강';
  return '기타';
}

type SortKey = 'latest' | 'price-asc' | 'price-desc' | 'ai-score' | 'discount';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'price-asc', label: '가격 낮은순' },
  { key: 'price-desc', label: '가격 높은순' },
  { key: 'ai-score', label: 'AI점수순' },
  { key: 'discount', label: '할인율순' },
];

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR');
}


function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '오늘 추가';
  if (days < 7) return `${days}일 전 추가`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전 추가`;
  return `${Math.floor(days / 30)}개월 전 추가`;
}

function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  const { product, savedAt } = item;
  const [imgFailed, setImgFailed] = useState(false);

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const hasRealImage = product.image && !product.image.includes('placeholder') && !imgFailed;
  const productLink = product.link
    ?? `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${product.brand} ${product.name}`)}`;

  return (
    <a
      href={productLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background transition-shadow hover:shadow-md"
    >
      {/* 이미지 */}
      <div className="relative aspect-square bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
        {hasRealImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 size-full object-contain p-3 transition-transform duration-200 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-zinc-200 dark:text-zinc-700">{product.brand?.[0] ?? '?'}</span>
          </div>
        )}
        {/* 쇼핑몰 뱃지 */}
        {product.mallName && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-zinc-200 dark:border-zinc-700">
            {product.mallName}
          </span>
        )}
        {/* 할인 뱃지 */}
        {discountPct > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{discountPct}%
          </span>
        )}
        {/* 하트 (해제) 버튼 */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:opacity-70 transition-opacity"
          title="관심상품 해제"
        >
          <Heart className="size-3.5 fill-rose-500" />
        </button>
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <p className="text-[11px] text-muted-foreground truncate">{product.brand}</p>
        )}
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{product.name}</p>
        <div className="mt-auto pt-2">
          {discountPct > 0 && (
            <p className="text-[10px] text-zinc-400 line-through">{formatPrice(product.originalPrice!)}원</p>
          )}
          <p className="text-sm font-bold text-foreground">
            {formatPrice(product.price)}<span className="text-xs font-medium">원</span>
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{timeAgo(savedAt)}</p>
        </div>
      </div>

      {/* 구매하러 가기 */}
      <div className="flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800 px-3 py-2 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <ExternalLink className="size-3" />
        구매하러 가기
      </div>
    </a>
  );
}

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFavorites(user.uid, (items) => {
      setFavorites(items);
      setFetching(false);
    });
    return unsub;
  }, [user]);

  const priceDropItems = useMemo(
    () => favorites.filter((f) => f.product.originalPrice && f.product.originalPrice > f.product.price),
    [favorites],
  );

  const categories = useMemo(() => {
    const cats = new Set(favorites.map((f) => detectCategory(f.product)));
    return ['전체', ...Array.from(cats), '가격 하락만'];
  }, [favorites]);

  const filtered = useMemo(() => {
    let list = favorites;

    if (activeCategory === '가격 하락만') {
      list = priceDropItems;
    } else if (activeCategory !== '전체') {
      list = list.filter((f) => detectCategory(f.product) === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.product.name.toLowerCase().includes(q) ||
          f.product.brand.toLowerCase().includes(q) ||
          f.product.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.product.price - b.product.price;
        case 'price-desc': return b.product.price - a.product.price;
        case 'ai-score': return b.product.aiScore - a.product.aiScore;
        case 'discount': {
          const pct = (f: FavoriteItem) =>
            f.product.originalPrice ? (f.product.originalPrice - f.product.price) / f.product.originalPrice : 0;
          return pct(b) - pct(a);
        }
        default: return 0;
      }
    });
  }, [favorites, priceDropItems, activeCategory, searchQuery, sortBy]);

  const currentSort = SORT_OPTIONS.find((o) => o.key === sortBy) ?? SORT_OPTIONS[0];
  const sortLabel = currentSort.key === 'latest' ? '최신순' : currentSort.label;

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white dark:bg-zinc-950">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-950">
      <SiteHeader active="wishlist" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* 제목 */}
        <div className="mb-6">
          <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground">관심 상품</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {!fetching
              ? <>총 {favorites.length}개의 상품을 관심 목록에 담아두었어요{priceDropItems.length > 0 && <> · 지금 <span className="font-semibold text-blue-500">{priceDropItems.length}개</span>가 가격 하락 중</>}</>
              : '관심 목록을 불러오는 중이에요'}
          </p>
        </div>

        {/* 검색 + 정렬 드롭다운 */}
        <div className="mb-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명 또는 브랜드 검색"
              className="h-9 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background pl-9 pr-9 text-xs text-foreground placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none sm:h-10 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3 text-xs font-medium text-foreground hover:border-zinc-400 transition-colors sm:h-10 sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline text-muted-foreground">≡</span>
              <span className="hidden sm:inline">{currentSort.label}</span>
              <span className="sm:hidden text-muted-foreground text-[11px]">{currentSort.label}</span>
              <ChevronDown className={cn('size-3.5 text-zinc-400 transition-transform', sortOpen && 'rotate-180')} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
                        sortBy === opt.key
                          ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-500 dark:text-zinc-400',
                      )}
                    >
                      {opt.label}
                      {sortBy === opt.key && (
                        <span className="size-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 카테고리 탭 */}
        {!fetching && favorites.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count =
                cat === '전체'
                  ? favorites.length
                  : cat === '가격 하락만'
                  ? priceDropItems.length
                  : favorites.filter((f) => detectCategory(f.product) === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-sm',
                    isActive
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                  )}
                >
                  {cat}
                  {cat !== '가격 하락만' && (
                    <span
                      className={cn(
                        'text-[10px] tabular-nums sm:text-xs',
                        isActive ? 'opacity-60' : 'text-zinc-400 dark:text-zinc-500',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 표시 개수 + 컬럼 선택 + 정렬 */}
        {!fetching && favorites.length > 0 && (
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-400 sm:text-sm">
            <span>{filtered.length}개 상품 표시 중</span>
            <span>{sortLabel} 정렬</span>
          </div>
        )}

        {/* 컨텐츠 */}
        {fetching ? (
          <div className="flex justify-center py-24">
            <div className="size-5 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">저장된 관심상품이 없어요</p>
            <p className="mt-1 text-sm text-zinc-400">AI에게 상품을 추천받고 북마크해 보세요</p>
            <Link
              href="/"
              className="mt-6 rounded-full bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900"
            >
              AI 쇼핑 시작하기
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">검색 결과가 없어요</p>
            <p className="mt-1 text-sm text-zinc-400">다른 검색어나 카테고리를 선택해 보세요</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('전체'); }}
              className="mt-6 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((item) => (
              <FavoriteCard
                key={item.docId}
                item={item}
                onRemove={() => removeFavorite(user.uid, item.docId)}
              />
            ))}
          </div>
        )}


      </main>
    </div>
  );
}
