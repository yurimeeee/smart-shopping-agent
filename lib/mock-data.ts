import type {
  CategorySpend,
  ChatMessage,
  MonthlySpendPoint,
  ProductComparisonMatrix,
  ProductItem,
  ReportInsight,
  ReportKpi,
  ReviewSummary,
  UtilityFeature,
  WatchedProduct,
} from './types'

export const products: ProductItem[] = [
  {
    id: 'tent-a',
    name: '트레일메이트 돔형 3인용 텐트',
    brand: '노르딕캠프',
    image: '/products/tent-1.png',
    price: 89000,
    originalPrice: 129000,
    rating: 4.6,
    reviewCount: 2841,
    shipping: '무료 · 내일 도착',
    tags: ['가성비', '3인용', '설치 5분'],
    pros: ['압도적인 가성비와 빠른 원터치 설치', '3계절 대응 방수 지수 3000mm'],
    cons: ['강풍에서는 팩 다운 필수', '수납 시 부피가 다소 큰 편'],
    aiScore: 92,
    recommended: true,
  },
  {
    id: 'tent-b',
    name: '울트라라이트 터널형 백패킹 텐트',
    brand: '릿지라인',
    image: '/products/tent-2.png',
    price: 156000,
    originalPrice: 189000,
    rating: 4.8,
    reviewCount: 1204,
    shipping: '무료 · 모레 도착',
    tags: ['초경량', '백패킹', '1.9kg'],
    pros: ['1.9kg의 초경량 · 백패킹에 최적', '고급 알루미늄 폴로 뛰어난 내구성'],
    cons: ['가격대가 높은 편', '내부 공간이 다소 좁음'],
    aiScore: 85,
  },
  {
    id: 'tent-c',
    name: '패밀리 리빙쉘 5인용 카빈 텐트',
    brand: '베이스캠프',
    image: '/products/tent-3.png',
    price: 214000,
    rating: 4.4,
    reviewCount: 3567,
    shipping: '무료 · 3일 내 도착',
    tags: ['대형', '5인용', '거실형'],
    pros: ['넓은 거실형 공간과 뛰어난 통풍', '전실 확장으로 다양한 활용 가능'],
    cons: ['혼자 설치하기 어려움', '무게가 무거워 오토캠핑 전용'],
    aiScore: 78,
  },
]

export const comparisonMatrix: ProductComparisonMatrix = {
  productIds: ['tent-a', 'tent-b', 'tent-c'],
  specs: [
    {
      key: 'price',
      label: '최저가',
      values: {
        'tent-a': '89,000원',
        'tent-b': '156,000원',
        'tent-c': '214,000원',
      },
      best: 'tent-a',
    },
    {
      key: 'shipping',
      label: '배송',
      values: {
        'tent-a': '무료 · 내일 도착',
        'tent-b': '무료 · 모레 도착',
        'tent-c': '무료 · 3일 내',
      },
      best: 'tent-a',
    },
    {
      key: 'capacity',
      label: '수용 인원',
      values: { 'tent-a': '3인용', 'tent-b': '1~2인용', 'tent-c': '5인용' },
      best: 'tent-c',
    },
    {
      key: 'weight',
      label: '무게',
      values: { 'tent-a': '3.4kg', 'tent-b': '1.9kg', 'tent-c': '9.8kg' },
      best: 'tent-b',
    },
    {
      key: 'waterproof',
      label: '방수 지수',
      values: { 'tent-a': '3,000mm', 'tent-b': '2,000mm', 'tent-c': '2,500mm' },
      best: 'tent-a',
    },
    {
      key: 'setup',
      label: '설치 난이도',
      values: { 'tent-a': '쉬움 (5분)', 'tent-b': '보통', 'tent-c': '어려움' },
      best: 'tent-a',
    },
    {
      key: 'score',
      label: 'AI 종합 구매 추천 지수',
      values: { 'tent-a': '92 / 100', 'tent-b': '85 / 100', 'tent-c': '78 / 100' },
      best: 'tent-a',
    },
  ],
}

export const reviewSummary: ReviewSummary = {
  totalReviews: 2841,
  positiveRatio: 87,
  positiveTags: [
    { label: '설치가 쉬워요', count: 1120, sentiment: 'positive' },
    { label: '가성비 최고', count: 964, sentiment: 'positive' },
    { label: '방수 튼튼함', count: 712, sentiment: 'positive' },
    { label: '공간 넉넉', count: 588, sentiment: 'positive' },
    { label: '통풍 잘됨', count: 331, sentiment: 'positive' },
  ],
  negativeTags: [
    { label: '수납 부피 큼', count: 214, sentiment: 'negative' },
    { label: '강풍에 약함', count: 156, sentiment: 'negative' },
    { label: '지퍼 뻑뻑', count: 88, sentiment: 'negative' },
  ],
  oneLineSummary:
    '설치가 간편하고 방수 성능이 뛰어나 캠핑 입문자에게 가장 추천되는 가성비 텐트입니다. 다만 수납 부피가 커 보관 공간을 미리 확인하세요.',
}

export const conversation: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: '이번 주말 캠핑 가는데 가성비 텐트 3개만 비교해줘',
    timestamp: '오후 2:14',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      '주말 캠핑용 가성비 텐트를 찾아드릴게요. 인원, 설치 편의성, 방수 성능, 가격을 기준으로 3개 제품을 비교 분석했습니다.',
    timestamp: '오후 2:14',
    steps: [
      {
        id: 's1',
        label: '요구사항 분석',
        detail: '주말 · 가성비 · 캠핑 초보 조건 파악',
        status: 'done',
      },
      {
        id: 's2',
        label: '실시간 가격 수집',
        detail: '쿠팡 · 네이버 등 12개 판매처 스캔',
        status: 'done',
      },
      {
        id: 's3',
        label: '리뷰 7,600여 건 분석',
        detail: '감성 분석으로 장단점 추출',
        status: 'done',
      },
      {
        id: 's4',
        label: '종합 추천 지수 산출',
        detail: '가격 대비 성능 가중치 적용',
        status: 'active',
      },
    ],
  },
  {
    id: 'm3',
    role: 'assistant',
    content:
      '오른쪽 워크스페이스에 큐레이션, 비교표, 리뷰 요약을 정리했어요. 결론부터 말하면 "트레일메이트 돔형 3인용"이 가성비 1위예요.',
    timestamp: '오후 2:15',
  },
]

export const utilityFeatures: UtilityFeature[] = [
  {
    id: 'u1',
    title: '상품 소싱 아이디어 & 링크 관리',
    description: '저장한 상품 링크를 자동 분류하고 최저가 변동을 추적합니다.',
    metric: '24',
    metricLabel: '관리 중인 링크',
    icon: 'link',
  },
  {
    id: 'u2',
    title: '대화 로그 기반 소비 패턴 분석',
    description: '대화 기록에서 관심 카테고리와 예산 흐름을 시각화합니다.',
    metric: '1.2M',
    metricLabel: '이번 달 관심 소비',
    icon: 'chart',
  },
  {
    id: 'u3',
    title: '나의 취향 큐레이션 프로필',
    description: '선호하는 브랜드, 스타일, 환경을 등록하고 맞춤형 픽(Pick)을 받아보세요.',
    metric: '86%',
    metricLabel: '추천 정확도',
    icon: 'lifestyle',
  },
]

/* ---------- 소비 리포트 데이터 ---------- */

export const reportKpis: ReportKpi[] = [
  {
    id: 'k1',
    label: '이번 달 관심 소비',
    value: '1,248,000',
    delta: '+12%',
    trend: 'up',
    positive: false,
    hint: '지난달 대비',
  },
  {
    id: 'k2',
    label: '관리 중인 관심상품',
    value: '24개',
    delta: '+5개',
    trend: 'up',
    positive: true,
    hint: '이번 달 추가',
  },
  {
    id: 'k3',
    label: '가격 추적 절약액',
    value: '186,400',
    delta: '+42,000',
    trend: 'up',
    positive: true,
    hint: '최저가 알림으로 절약',
  },
  {
    id: 'k4',
    label: 'AI 추천 채택률',
    value: '86%',
    delta: '+4%p',
    trend: 'up',
    positive: true,
    hint: '추천 → 구매 전환',
  },
]

export const monthlySpend: MonthlySpendPoint[] = [
  { month: '1월', interest: 620000, purchased: 340000 },
  { month: '2월', interest: 740000, purchased: 410000 },
  { month: '3월', interest: 690000, purchased: 380000 },
  { month: '4월', interest: 910000, purchased: 520000 },
  { month: '5월', interest: 1040000, purchased: 610000 },
  { month: '6월', interest: 980000, purchased: 470000 },
  { month: '7월', interest: 1248000, purchased: 690000 },
]

export const categorySpend: CategorySpend[] = [
  { category: '캠핑·아웃도어', amount: 540000, share: 43 },
  { category: '가전·디지털', amount: 312000, share: 25 },
  { category: '홈·리빙', amount: 224000, share: 18 },
  { category: '패션·잡화', amount: 112000, share: 9 },
  { category: '기타', amount: 60000, share: 5 },
]

export const watchedProducts: WatchedProduct[] = [
  {
    id: 'w1',
    name: '트레일메이트 돔형 3인용 텐트',
    brand: '노르딕캠프',
    image: '/products/tent-1.png',
    category: '캠핑·아웃도어',
    currentPrice: 89000,
    addedPrice: 129000,
    lowestPrice: 85000,
    status: 'drop',
    changePct: -31,
    aiScore: 92,
  },
  {
    id: 'w2',
    name: '울트라라이트 터널형 백패킹 텐트',
    brand: '릿지라인',
    image: '/products/tent-2.png',
    category: '캠핑·아웃도어',
    currentPrice: 156000,
    addedPrice: 149000,
    lowestPrice: 142000,
    status: 'rise',
    changePct: 5,
    aiScore: 85,
  },
  {
    id: 'w3',
    name: '패밀리 리빙쉘 5인용 카빈 텐트',
    brand: '베이스캠프',
    image: '/products/tent-3.png',
    category: '캠핑·아웃도어',
    currentPrice: 214000,
    addedPrice: 214000,
    lowestPrice: 209000,
    status: 'stable',
    changePct: 0,
    aiScore: 78,
  },
  {
    id: 'w4',
    name: '릴렉스 폴딩 캠핑 체어',
    brand: '베이스캠프',
    image: '/products/chair.png',
    category: '캠핑·아웃도어',
    currentPrice: 42000,
    addedPrice: 59000,
    lowestPrice: 41000,
    status: 'drop',
    changePct: -29,
    aiScore: 88,
  },
  {
    id: 'w5',
    name: '충전식 LED 캠핑 랜턴 500lm',
    brand: '루멘스',
    image: '/products/lantern.png',
    category: '가전·디지털',
    currentPrice: 34900,
    addedPrice: 32000,
    lowestPrice: 29900,
    status: 'rise',
    changePct: 9,
    aiScore: 81,
  },
]

export const reportInsights: ReportInsight[] = [
  {
    id: 'i1',
    title: '지금이 구매 적기예요',
    detail:
      '관심상품 3개가 등록가 대비 최저가에 근접했습니다. 특히 "폴딩 캠핑 체어"는 최근 6개월 최저가로, 지금 구매 시 약 17,000원 절약할 수 있어요.',
    tone: 'positive',
  },
  {
    id: 'i2',
    title: '캠핑 카테고리 집중도가 높아요',
    detail:
      '이번 달 관심 소비의 43%가 캠핑·아웃도어에 집중됐어요. 시즌 특성을 고려하면 8월 이후 가격 하락이 예상되니 비필수 품목은 대기하는 것도 방법입니다.',
    tone: 'neutral',
  },
  {
    id: 'i3',
    title: '가격 상승 품목 주의',
    detail:
      '"LED 캠핑 랜턴"이 등록가 대비 9% 상승했습니다. 대체 상품 2종이 더 낮은 가격에 있어 비교표를 확인해 보세요.',
    tone: 'warning',
  },
]
