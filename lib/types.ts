export type ChatRole = 'user' | 'assistant'

export interface ReasoningStep {
  id: string
  label: string
  detail: string
  status: 'done' | 'active' | 'pending'
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  /** Optional structured reasoning shown for assistant messages */
  steps?: ReasoningStep[]
}

export interface ProductItem {
  id: string
  name: string
  brand: string
  image: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  shipping: string
  tags: string[]
  pros: string[]
  cons: string[]
  /** 0 - 100 AI recommendation index */
  aiScore: number
  recommended?: boolean
  link?: string
  mallName?: string
}

export interface ComparisonSpec {
  key: string
  label: string
  /** Values keyed by product id */
  values: Record<string, string>
  /** Product id that wins this spec, if any */
  best?: string
}

export interface ProductComparisonMatrix {
  productIds: string[]
  specs: ComparisonSpec[]
}

export interface SentimentTag {
  label: string
  count: number
  sentiment: 'positive' | 'negative'
}

export interface ReviewSummary {
  totalReviews: number
  positiveRatio: number
  positiveTags: SentimentTag[]
  negativeTags: SentimentTag[]
  oneLineSummary: string
}

export interface UtilityFeature {
  id: string
  title: string
  description: string
  metric: string
  metricLabel: string
  icon: 'link' | 'chart' | 'lifestyle'
}

/* ---------- 소비 리포트 ---------- */

export interface ReportKpi {
  id: string
  label: string
  value: string
  /** e.g. "+12%" or "-3건" */
  delta: string
  trend: 'up' | 'down' | 'flat'
  /** whether the delta direction is good for the user */
  positive: boolean
  hint: string
}

export interface MonthlySpendPoint {
  month: string
  /** 관심상품 기준 예상 소비 (원) */
  interest: number
  /** 실제 구매 금액 (원) */
  purchased: number
}

export interface CategorySpend {
  category: string
  amount: number
  /** share of total, 0-100 */
  share: number
}

export interface WatchedProduct {
  id: string
  name: string
  brand: string
  image: string
  category: string
  currentPrice: number
  /** price when it was first added to the watchlist */
  addedPrice: number
  /** lowest price seen while watching */
  lowestPrice: number
  status: 'drop' | 'rise' | 'stable'
  /** signed percentage change vs addedPrice */
  changePct: number
  aiScore: number
}

export interface ReportInsight {
  id: string
  title: string
  detail: string
  tone: 'positive' | 'neutral' | 'warning'
}

export interface TasteProfile {
  tags: string[]
  customNote: string
  platforms: string[]
  priceBalance: number
}
