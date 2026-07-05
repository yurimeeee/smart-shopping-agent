import { GoogleGenAI, Type } from '@google/genai';
import { buildTasteContext } from '@/lib/taste-context';
import type { TasteProfile } from '@/lib/types';

const BASE_SYSTEM_PROMPT = `당신은 한국 온라인 쇼핑 전문 AI입니다. 사용자 요청에 맞는 실제 한국 시장 상품 3개를 추천하고 분석하세요.
- 실제 존재할 법한 구체적인 브랜드와 제품명을 사용하세요
- 가격은 한국 원화 기준 실제 시세에 맞게 설정하세요 (숫자만, 단위 없이)
- 장단점은 실제 소비자 관점으로 현실적으로 작성하세요
- aiScore는 0-100 사이 정수로, 가장 추천되는 상품 1개만 recommended: true로 설정하세요`;

export async function POST(req: Request) {
  const { query, tasteProfile } = await req.json() as { query: string; tasteProfile?: TasteProfile };

  const systemPrompt = BASE_SYSTEM_PROMPT + (tasteProfile ? buildTasteContext(tasteProfile) : '');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '워크스페이스 제목 (예: 캠핑 텐트 · 가성비 비교)' },
            productCount: { type: Type.INTEGER },
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
            comparisonSpecs: {
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
            },
            reviewSummary: {
              type: Type.OBJECT,
              properties: {
                totalReviews: { type: Type.INTEGER },
                positiveRatio: { type: Type.INTEGER },
                positiveTags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      count: { type: Type.INTEGER },
                    },
                    required: ['label', 'count'],
                  },
                },
                negativeTags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      count: { type: Type.INTEGER },
                    },
                    required: ['label', 'count'],
                  },
                },
                oneLineSummary: { type: Type.STRING },
              },
              required: ['totalReviews', 'positiveRatio', 'positiveTags', 'negativeTags', 'oneLineSummary'],
            },
          },
          required: ['title', 'products', 'comparisonSpecs', 'reviewSummary'],
        },
      },
    });

    const text = response.text;
    if (!text) return Response.json({ error: 'Empty response' }, { status: 502 });

    const data = JSON.parse(text);

    // Fetch product images from Naver Shopping API in parallel
    const naverId = process.env.NAVER_CLIENT_ID;
    const naverSecret = process.env.NAVER_CLIENT_SECRET;

    if (naverId && naverSecret && Array.isArray(data.products)) {
      const imageResults = await Promise.allSettled(
        data.products.map(async (p: { brand: string; name: string }) => {
          const q = encodeURIComponent(`${p.brand} ${p.name}`);
          const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${q}&display=1`, {
            headers: {
              'X-Naver-Client-Id': naverId,
              'X-Naver-Client-Secret': naverSecret,
            },
          });
          if (!res.ok) return null;
          const json = await res.json() as { items?: { image?: string }[] };
          return json.items?.[0]?.image ?? null;
        }),
      );

      data.products = data.products.map((p: object, i: number) => ({
        ...p,
        imageUrl: imageResults[i].status === 'fulfilled' ? imageResults[i].value : null,
      }));
    }

    return Response.json(data);
  } catch (err) {
    console.error('[products/route]', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
