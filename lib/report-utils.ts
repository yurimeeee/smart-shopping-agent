import type { CategorySpend, MonthlySpendPoint, ReportInsight, ReportKpi } from './types';

import type { FavoriteItem } from './firestore';
import type { ProductItem } from './types';

const KOREAN_MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

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

export function computeKpis(
  favorites: FavoriteItem[],
  chatCount: number,
  chatWithAnalysisCount: number,
): ReportKpi[] {
  const totalInterest = favorites.reduce((s, f) => s + f.product.price, 0);
  const totalSaved = favorites.reduce((s, f) => {
    const orig = f.product.originalPrice ?? f.product.price;
    return s + Math.max(0, orig - f.product.price);
  }, 0);
  const adoptionRate = chatCount > 0 ? Math.round((chatWithAnalysisCount / chatCount) * 100) : 0;

  return [
    {
      id: 'k1',
      label: '관심상품 소비 총액',
      value: `${totalInterest.toLocaleString('ko-KR')}원`,
      delta: `${favorites.length}개 상품`,
      trend: 'flat',
      positive: true,
      hint: '관심상품 기준',
    },
    {
      id: 'k2',
      label: '관리 중인 관심상품',
      value: `${favorites.length}개`,
      delta: favorites.length > 0 ? `최근 ${formatRelativeDate(favorites[0]?.savedAt)}` : '-',
      trend: 'up',
      positive: true,
      hint: '위시리스트 저장',
    },
    {
      id: 'k3',
      label: '할인 절약 금액',
      value: totalSaved > 0 ? `${totalSaved.toLocaleString('ko-KR')}원` : '0',
      delta: totalSaved > 0 ? '정가 대비 절약' : '할인 상품 없음',
      trend: totalSaved > 0 ? 'up' : 'flat',
      positive: totalSaved > 0,
      hint: '정가 기준',
    },
    {
      id: 'k4',
      label: 'AI 추천 채택률',
      value: chatCount > 0 ? `${adoptionRate}%` : '-',
      delta: `${chatWithAnalysisCount}/${chatCount} 대화`,
      trend: adoptionRate >= 50 ? 'up' : 'flat',
      positive: adoptionRate >= 50,
      hint: '분석 완료 대화 기준',
    },
  ];
}

export function computeMonthlySpend(favorites: FavoriteItem[]): MonthlySpendPoint[] {
  const now = new Date();
  const months: MonthlySpendPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = KOREAN_MONTHS[d.getMonth()];
    const interest = favorites
      .filter((f) => {
        const s = f.savedAt;
        return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth();
      })
      .reduce((s, f) => s + f.product.price, 0);
    months.push({ month: label, interest, purchased: 0 });
  }

  return months;
}

export function computeCategorySpend(favorites: FavoriteItem[]): CategorySpend[] {
  const map: Record<string, number> = {};
  for (const f of favorites) {
    const cat = detectCategory(f.product);
    map[cat] = (map[cat] ?? 0) + f.product.price;
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      share: Math.round((amount / total) * 100),
    }));
}

export function computeInsights(
  favorites: FavoriteItem[],
  categorySpend: CategorySpend[],
): ReportInsight[] {
  const insights: ReportInsight[] = [];

  if (favorites.length === 0) {
    insights.push({
      id: 'i-empty',
      title: '관심상품을 등록해 보세요',
      detail: 'AI 쇼핑 큐레이터에게 상품을 추천받아 위시리스트에 저장하면 소비 패턴 분석이 시작됩니다.',
      tone: 'neutral',
    });
    return insights;
  }

  // 최고 할인 상품
  const bestDiscount = favorites
    .filter((f) => f.product.originalPrice && f.product.originalPrice > f.product.price)
    .sort((a, b) => {
      const da = (a.product.originalPrice! - a.product.price) / a.product.originalPrice!;
      const db = (b.product.originalPrice! - b.product.price) / b.product.originalPrice!;
      return db - da;
    })[0];

  if (bestDiscount) {
    const pct = Math.round(
      ((bestDiscount.product.originalPrice! - bestDiscount.product.price) /
        bestDiscount.product.originalPrice!) *
      100,
    );
    insights.push({
      id: 'i-discount',
      title: `${pct}% 할인 상품이 있어요`,
      detail: `"${bestDiscount.product.name}"이(가) 정가 대비 ${pct}% 할인 중입니다. 지금 구매 시 ${(bestDiscount.product.originalPrice! - bestDiscount.product.price).toLocaleString('ko-KR')} 절약할 수 있어요.`,
      tone: 'positive',
    });
  }

  // 카테고리 집중도
  if (categorySpend.length > 0 && categorySpend[0].share >= 40) {
    insights.push({
      id: 'i-category',
      title: `${categorySpend[0].category} 집중도가 높아요`,
      detail: `이번 달 관심 소비의 ${categorySpend[0].share}%가 ${categorySpend[0].category}에 집중됐어요. 다양한 카테고리를 탐색해 보는 것도 좋아요.`,
      tone: 'neutral',
    });
  }

  // 고AI점수 상품
  const topPick = favorites.sort((a, b) => b.product.aiScore - a.product.aiScore)[0];
  if (topPick && topPick.product.aiScore >= 85) {
    insights.push({
      id: 'i-top',
      title: 'AI 추천 지수가 높은 상품이 있어요',
      detail: `"${topPick.product.name}"의 AI 추천 지수가 ${topPick.product.aiScore}/100으로 관심상품 중 가장 높습니다. 구매를 적극 고려해 보세요.`,
      tone: 'positive',
    });
  }

  return insights.slice(0, 3);
}

function formatRelativeDate(date?: Date): string {
  if (!date) return '-';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '오늘 추가';
  if (diff === 1) return '어제 추가';
  if (diff < 7) return `${diff}일 전 추가`;
  return `${Math.floor(diff / 7)}주 전 추가`;
}
