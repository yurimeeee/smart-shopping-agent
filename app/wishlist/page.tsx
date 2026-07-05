'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookmarkCheck,
  ExternalLink,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeFavorites, removeFavorite, type FavoriteItem } from '@/lib/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductItem } from '@/lib/types';

/* ── 카테고리 감지 (report-utils와 동일 로직) ── */
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

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR');
}

/* ── 썸네일 ── */
function ProductThumbnail({ product }: { product: ProductItem }) {
  const [failed, setFailed] = useState(false);
  const hue = product.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const hasRealImage = product.image && !product.image.includes('placeholder') && !failed;

  if (hasRealImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 size-full object-contain p-3"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3"
      style={{ background: `linear-gradient(135deg, hsl(${hue},30%,95%), hsl(${hue},45%,85%))` }}
    >
      <div className="text-lg font-black opacity-30" style={{ color: `hsl(${hue},50%,30%)` }}>
        {product.brand[0]}
      </div>
    </div>
  );
}

/* ── 상품 카드 ── */
function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  const { product } = item;
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-background transition-shadow hover:shadow-sm',
        product.recommended ? 'border-foreground' : 'border-zinc-200 dark:border-zinc-700',
      )}
    >
      <div className="relative h-44 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <ProductThumbnail product={product} />
        {product.recommended && (
          <Badge className="absolute left-3 top-3 gap-1">
            <Star className="size-3 fill-current" />
            AI 1순위
          </Badge>
        )}
        {discountPct > 0 && (
          <span className="absolute left-3 bottom-3 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            -{discountPct}%
          </span>
        )}
        <button
          onClick={onRemove}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full border border-rose-200 bg-background/90 text-rose-400 backdrop-blur transition-colors hover:border-rose-400 hover:bg-rose-50"
          title="관심상품 삭제"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">{product.name}</h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>·</span>
          <span>리뷰 {formatPrice(product.reviewCount)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between">
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
            className="flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            상세 보기 <ExternalLink className="size-3" />
          </a>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{product.shipping}</p>
      </div>
    </article>
  );
}

/* ── 메인 페이지 ── */
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

  /* 카테고리 목록 (실데이터 기반) */
  const categories = useMemo(() => {
    const cats = new Set(favorites.map((f) => detectCategory(f.product)));
    return ['전체', ...Array.from(cats)];
  }, [favorites]);

  /* 필터 + 검색 + 정렬 */
  const filtered = useMemo(() => {
    let list = favorites;

    if (activeCategory !== '전체') {
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

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.product.price - b.product.price;
        case 'price-desc': return b.product.price - a.product.price;
        case 'ai-score': return b.product.aiScore - a.product.aiScore;
        case 'discount': {
          const da = a.product.originalPrice
            ? (a.product.originalPrice - a.product.price) / a.product.originalPrice
            : 0;
          const db = b.product.originalPrice
            ? (b.product.originalPrice - b.product.price) / b.product.originalPrice
            : 0;
          return db - da;
        }
        default: return 0; // latest: already sorted by savedAt desc from Firestore
      }
    });

    return list;
  }, [favorites, activeCategory, searchQuery, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? '정렬';

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">PickS</span>
          </Link>
          <span className="ml-1 text-muted-foreground">/</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <BookmarkCheck className="size-4" />
            내 관심상품
          </span>
        </div>
        <Link
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          AI 쇼핑으로 돌아가기
        </Link>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">

          {/* 타이틀 + 검색 + 정렬 */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">관심상품</h1>
              <p className="text-xs text-muted-foreground">
                {fetching
                  ? '불러오는 중...'
                  : `전체 ${favorites.length}개 · ${activeCategory !== '전체' ? `${activeCategory} ${filtered.length}개` : `표시 ${filtered.length}개`}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* 검색창 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명, 브랜드 검색"
                  className="h-8 w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background pl-8 pr-8 text-xs focus:border-zinc-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* 정렬 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors',
                    sortBy !== 'latest'
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <SlidersHorizontal className="size-3.5" />
                  {currentSortLabel}
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-36 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background shadow-lg">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
                            sortBy === opt.key ? 'font-semibold text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {opt.label}
                          {sortBy === opt.key && <span className="size-1.5 rounded-full bg-foreground" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 카테고리 탭 */}
          {!fetching && favorites.length > 0 && (
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const count =
                  cat === '전체'
                    ? favorites.length
                    : favorites.filter((f) => detectCategory(f.product) === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                      activeCategory === cat
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:border-zinc-400 hover:text-foreground',
                    )}
                  >
                    {cat}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        activeCategory === cat
                          ? 'bg-white/20 text-background'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 컨텐츠 */}
          {fetching ? (
            <div className="flex justify-center py-24">
              <div className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookmarkCheck className="mb-3 size-10 text-zinc-200" />
              <p className="text-sm font-medium text-foreground">저장된 관심상품이 없어요</p>
              <p className="mt-1 text-xs text-muted-foreground">AI에게 상품을 추천받고 북마크해 보세요</p>
              <Link
                href="/"
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
              >
                AI 쇼핑 시작하기
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="mb-3 size-10 text-zinc-200" />
              <p className="text-sm font-medium text-foreground">검색 결과가 없어요</p>
              <p className="mt-1 text-xs text-muted-foreground">다른 검색어나 카테고리를 선택해 보세요</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('전체'); }}
                className="mt-4 rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
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

        </div>
      </main>
    </div>
  );
}
