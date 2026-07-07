/** @jest-environment node */
// Mock @google/genai before importing the route
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: {
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
  },
}));

// Mock taste-context
jest.mock('@/lib/taste-context', () => ({
  buildTasteContext: jest.fn(() => ''),
}));

import { POST } from '@/app/api/products/route';

const NAVER_ITEM = {
  title: '<b>노트북</b> 추천',
  link: 'https://example.com/product/1',
  image: 'https://example.com/img.jpg',
  lprice: '1000000',
  hprice: '1200000',
  mallName: '쿠팡',
  productId: 'prod-001',
  brand: 'Samsung',
  maker: 'Samsung Electronics',
};

function makePostRequest(body: object) {
  return new Request('http://localhost/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeNaverResponse(items: object[]) {
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/products', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NAVER_CLIENT_ID = 'test-naver-id';
    process.env.NAVER_CLIENT_SECRET = 'test-naver-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns 500 when no geminiKey and no naverItems', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;
    jest.spyOn(global, 'fetch').mockResolvedValue(makeNaverResponse([]));
    const res = await POST(makePostRequest({ query: '노트북' }));
    expect(res.status).toBe(500);
  });

  it('returns Naver fallback when no geminiKey but naverItems exist', async () => {
    delete process.env.GEMINI_API_KEY;
    jest.spyOn(global, 'fetch').mockResolvedValue(makeNaverResponse([NAVER_ITEM]));
    const res = await POST(makePostRequest({ query: '노트북' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toBe('노트북 추천');
  });

  it('returns Naver fallback when Gemini throws and naverItems available', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(makeNaverResponse([NAVER_ITEM]));
    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'));
    const res = await POST(makePostRequest({ query: '노트북' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products).toHaveLength(1);
    expect(data.reviewSummary.oneLineSummary).toContain('네이버');
  });

  it('returns 500 when Gemini throws and no naverItems', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(makeNaverResponse([]));
    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'));
    const res = await POST(makePostRequest({ query: '노트북' }));
    expect(res.status).toBe(500);
  });

  it('merges Gemini analysis with Naver products on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(makeNaverResponse([NAVER_ITEM]));

    const geminiAnalysis = {
      title: 'Samsung 노트북 비교',
      productAnalyses: [
        {
          index: 0,
          rating: 4.5,
          reviewCount: 1234,
          shipping: '무료배송',
          tags: ['가성비', '경량'],
          pros: ['가벼움'],
          cons: ['배터리'],
          aiScore: 88,
          recommended: true,
        },
      ],
      comparisonSpecs: [],
      reviewSummary: {
        totalReviews: 100,
        positiveRatio: 80,
        positiveTags: [],
        negativeTags: [],
        oneLineSummary: '전반적으로 만족도가 높습니다.',
      },
    };

    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(geminiAnalysis) });

    const res = await POST(makePostRequest({ query: '노트북' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('Samsung 노트북 비교');
    expect(data.products[0].rating).toBe(4.5);
    expect(data.products[0].aiScore).toBe(88);
    expect(data.products[0].recommended).toBe(true);
  });
});
