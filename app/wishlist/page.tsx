'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Search, Star, TrendingDown, TrendingUp, X } from 'lucide-react';
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
  { key: 'latest', label: 'recent' },
  { key: 'price-asc', label: '가격 낮은순' },
  { key: 'price-desc', label: '가격 높은순' },
  { key: 'ai-score', label: 'AI점수순' },
  { key: 'discount', label: '할인율순' },
];

function formatPrice(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
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

function ProductThumbnail({ product }: { product: ProductItem }) {
  const [failed, setFailed] = useState(false);
  const hue = product.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hasRealImage = product.image && !product.image.includes('placeholder') && !failed;

  return hasRealImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      className="absolute inset-0 size-full object-contain p-6"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(${hue},30%,95%), hsl(${hue},45%,85%))` }}
    >
      <span className="text-5xl font-black opacity-10" style={{ color: `hsl(${hue},50%,20%)` }}>
        {product.brand[0]}
      </span>
    </div>
  );
}

function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  const { product, savedAt } = item;
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
  const isPriceUp = !!(product.originalPrice && product.originalPrice < product.price);
  const isSoldOut = product.shipping?.includes('품절');

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow">
      {/* 이미지 영역 */}
      <div className="relative aspect-[4/3] bg-zinc-50 dark:bg-zinc-800">
        <ProductThumbnail product={product} />
        {isSoldOut && (
          <span className="absolute left-3 top-3 rounded-md bg-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            품절
          </span>
        )}
        <button
          onClick={onRemove}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 text-zinc-400 hover:text-rose-500 transition-colors backdrop-blur-sm border border-zinc-200 dark:border-zinc-700"
          title="관심상품 삭제"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 상품 정보 */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        {/* 브랜드 + 추가일 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{product.brand}</span>
          <span className="text-[11px] text-zinc-400">{timeAgo(savedAt)}</span>
        </div>

        {/* 상품명 */}
        <h3 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {product.name}
        </h3>

        {/* 별점 + 리뷰 + AI점수 */}
        <div className="flex items-center gap-1 text-xs">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{product.rating}</span>
          <span className="text-zinc-400">({product.reviewCount.toLocaleString()})</span>
          <span className="ml-auto rounded bg-zinc-900 dark:bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-white dark:text-zinc-900">
            AI {product.aiScore}
          </span>
        </div>

        {/* 가격 + 구매하기 */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-1 text-xs">
              {discountPct > 0 && (
                <>
                  <TrendingDown className="size-3 shrink-0 text-blue-500" />
                  <span className="font-semibold text-blue-500">{discountPct}%</span>
                  <span className="text-zinc-400 line-through tabular-nums">
                    {formatPrice(product.originalPrice!)}
                  </span>
                </>
              )}
              {isPriceUp && (
                <>
                  <TrendingUp className="size-3 shrink-0 text-rose-500" />
                  <span className="font-semibold text-rose-500">가격 상승</span>
                </>
              )}
              {!discountPct && !isPriceUp && <span className="text-zinc-400">{product.shipping}</span>}
            </div>
          </div>
          <a
            href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${product.brand} ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            {isSoldOut ? '재판매 문의' : '구매하기'}
          </a>
        </div>
      </div>
    </article>
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
      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* 제목 */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">관심 상품</h1>
          {!fetching && (
            <p className="mt-1.5 text-sm text-zinc-500">
              총 {favorites.length}개의 상품을 관심 목록에 담아두었어요
              {priceDropItems.length > 0 && (
                <>
                  {' · '}지금{' '}
                  <span className="font-semibold text-blue-500">{priceDropItems.length}개</span>가 가격 하락 중
                </>
              )}
            </p>
          )}
        </div>

        {/* 검색 + 정렬 드롭다운 */}
        <div className="mb-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명 또는 브랜드로 검색"
              className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
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
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 transition-colors"
            >
              <span className="text-base leading-none text-zinc-400">≡</span>
              {currentSort.label}
              <ChevronDown className={cn('size-4 text-zinc-400 transition-transform', sortOpen && 'rotate-180')} />
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
                    'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                  )}
                >
                  {cat}
                  {cat !== '가격 하락만' && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
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

        {/* 표시 개수 + 정렬 */}
        {!fetching && favorites.length > 0 && (
          <div className="mb-5 flex items-center justify-between text-sm text-zinc-400">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
