import { GoogleGenAI, Type } from '@google/genai';
import { buildTasteContext } from '@/lib/taste-context';
import type { TasteProfile } from '@/lib/types';

interface NaverItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  brand: string;
  maker: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function proxyImage(url: string): string {
  if (!url) return '';
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

async function searchNaverShopping(query: string, clientId: string, clientSecret: string): Promise<NaverItem[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${q}&display=5&sort=sim`, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  });
  if (!res.ok) return [];
  const data = await res.json() as { items?: NaverItem[] };
  return data.items ?? [];
}

const ANALYSIS_SYSTEM_PROMPT = `당신은 한국 온라인 쇼핑 전문 AI입니다. 제공된 실제 상품 목록을 분석하여 소비자 관점의 인사이트를 제공하세요.
- 제공된 실제 상품 데이터를 기반으로 현실적인 분석을 하세요
- aiScore는 0-100 사이 정수로, 가장 추천되는 상품 1개만 recommended: true로 설정하세요
- rating은 해당 카테고리 시장 평균을 참고하여 3.5~5.0 사이로 추정하세요
- reviewCount는 상품 카테고리와 브랜드를 고려해 현실적으로 추정하세요`;

const GEMINI_ONLY_SYSTEM_PROMPT = `당신은 한국 온라인 쇼핑 전문 AI입니다. 사용자 요청에 맞는 실제 한국 시장 상품 3개를 추천하고 분석하세요.
- 실제 존재할 법한 구체적인 브랜드와 제품명을 사용하세요
- 가격은 한국 원화 기준 실제 시세에 맞게 설정하세요 (숫자만, 단위 없이)
- 장단점은 실제 소비자 관점으로 현실적으로 작성하세요
- aiScore는 0-100 사이 정수로, 가장 추천되는 상품 1개만 recommended: true로 설정하세요`;

const comparisonSpecsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING },
      label: { type: Type.STRING },
      values: { type: Type.ARRAY, items: { type: Type.STRING }, description: '상품 순서대로 각 항목 값' },
      bestIndex: { type: Type.INTEGER, description: '가장 우수한 제품의 인덱스 (0-based), 없으면 -1' },
    },
    required: ['key', 'label', 'values', 'bestIndex'],
  },
};

const reviewSummarySchema = {
  type: Type.OBJECT,
  properties: {
    totalReviews: { type: Type.INTEGER },
    positiveRatio: { type: Type.INTEGER },
    positiveTags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { label: { type: Type.STRING }, count: { type: Type.INTEGER } },
        required: ['label', 'count'],
      },
    },
    negativeTags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { label: { type: Type.STRING }, count: { type: Type.INTEGER } },
        required: ['label', 'count'],
      },
    },
    oneLineSummary: { type: Type.STRING },
  },
  required: ['totalReviews', 'positiveRatio', 'positiveTags', 'negativeTags', 'oneLineSummary'],
};

export async function POST(req: Request) {
  const { query, tasteProfile } = await req.json() as { query: string; tasteProfile?: TasteProfile };

  const naverId = process.env.NAVER_CLIENT_ID;
  const naverSecret = process.env.NAVER_CLIENT_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return Response.json({ error: 'No API key' }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey: geminiKey });

  try {
    // Step 1: Naver Shopping에서 실제 상품 검색
    const naverItems = naverId && naverSecret
      ? await searchNaverShopping(query, naverId, naverSecret)
      : [];

    // Step 2: Naver 결과가 있으면 Gemini로 분석, 없으면 Gemini 단독 생성
    if (naverItems.length > 0) {
      const productSummaries = naverItems.map((item, i) => ({
        index: i,
        name: stripHtml(item.title),
        brand: item.brand || item.maker || item.mallName,
        price: parseInt(item.lprice) || 0,
        mallName: item.mallName,
      }));

      const tasteCtx = tasteProfile ? buildTasteContext(tasteProfile) : '';
      const prompt = `사용자 요청: "${query}"\n\n실제 검색된 상품 목록:\n${JSON.stringify(productSummaries, null, 2)}\n\n위 상품들을 분석해주세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: ANALYSIS_SYSTEM_PROMPT + tasteCtx,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              productAnalyses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    index: { type: Type.INTEGER },
                    rating: { type: Type.NUMBER },
                    reviewCount: { type: Type.INTEGER },
                    shipping: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    aiScore: { type: Type.INTEGER },
                    recommended: { type: Type.BOOLEAN },
                  },
                  required: ['index', 'rating', 'reviewCount', 'shipping', 'tags', 'pros', 'cons', 'aiScore', 'recommended'],
                },
              },
              comparisonSpecs: comparisonSpecsSchema,
              reviewSummary: reviewSummarySchema,
            },
            required: ['title', 'productAnalyses', 'comparisonSpecs', 'reviewSummary'],
          },
        },
      });

      const text = response.text;
      if (!text) return Response.json({ error: 'Empty response' }, { status: 502 });

      const analysis = JSON.parse(text);

      // Step 3: Naver 상품 데이터 + Gemini 분석 병합
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = analysis.productAnalyses.map((a: any) => {
        const naver = naverItems[a.index];
        const lprice = parseInt(naver.lprice) || 0;
        const hprice = parseInt(naver.hprice) || 0;
        return {
          id: naver.productId || String(a.index),
          name: stripHtml(naver.title),
          brand: naver.brand || naver.maker || naver.mallName,
          price: lprice,
          originalPrice: hprice > lprice ? hprice : undefined,
          image: proxyImage(naver.image),
          link: naver.link,
          mallName: naver.mallName,
          rating: a.rating,
          reviewCount: a.reviewCount,
          shipping: a.shipping,
          tags: a.tags,
          pros: a.pros,
          cons: a.cons,
          aiScore: a.aiScore,
          recommended: a.recommended,
        };
      });

      const productIds = products.map((p: { id: string }) => p.id);
      const comparisonMatrix = {
        productIds,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        specs: (analysis.comparisonSpecs ?? []).map((s: any) => ({
          key: s.key,
          label: s.label,
          values: Object.fromEntries(productIds.map((id: string, i: number) => [id, s.values[i] ?? ''])),
          best: s.bestIndex >= 0 ? productIds[s.bestIndex] : undefined,
        })),
      };

      return Response.json({ title: analysis.title, products, comparisonMatrix, reviewSummary: analysis.reviewSummary });
    }

    // Fallback: Naver 결과 없을 때 Gemini 단독 생성
    const tasteCtx = tasteProfile ? buildTasteContext(tasteProfile) : '';
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: GEMINI_ONLY_SYSTEM_PROMPT + tasteCtx,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  price: { type: Type.INTEGER },
                  originalPrice: { type: Type.INTEGER },
                  rating: { type: Type.NUMBER },
                  reviewCount: { type: Type.INTEGER },
                  shipping: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  aiScore: { type: Type.INTEGER },
                  recommended: { type: Type.BOOLEAN },
                },
                required: ['id', 'name', 'brand', 'price', 'rating', 'reviewCount', 'shipping', 'tags', 'pros', 'cons', 'aiScore', 'recommended'],
              },
            },
            comparisonSpecs: comparisonSpecsSchema,
            reviewSummary: reviewSummarySchema,
          },
          required: ['title', 'products', 'comparisonSpecs', 'reviewSummary'],
        },
      },
    });

    const text = response.text;
    if (!text) return Response.json({ error: 'Empty response' }, { status: 502 });

    const data = JSON.parse(text);
    const productIds = data.products.map((p: { id: string }) => p.id);
    const comparisonMatrix = {
      productIds,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      specs: (data.comparisonSpecs ?? []).map((s: any) => ({
        key: s.key,
        label: s.label,
        values: Object.fromEntries(productIds.map((id: string, i: number) => [id, s.values[i] ?? ''])),
        best: s.bestIndex >= 0 ? productIds[s.bestIndex] : undefined,
      })),
    };

    return Response.json({ title: data.title, products: data.products, comparisonMatrix, reviewSummary: data.reviewSummary });

  } catch (err) {
    console.error('[products/route]', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
