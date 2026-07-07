/** @jest-environment node */
import { GET } from '@/app/api/search/route';

const NAVER_ITEM = {
  title: '<b>노트북</b>',
  link: 'https://example.com/product',
  image: 'https://example.com/img.jpg',
  lprice: '1000000',
  hprice: '1200000',
  mallName: '네이버쇼핑',
  productId: 'prod-001',
  brand: 'Samsung',
  maker: 'Samsung Electronics',
  category1: '디지털/가전',
  category2: '노트북',
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/search');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/search', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NAVER_CLIENT_ID = 'test-id';
    process.env.NAVER_CLIENT_SECRET = 'test-secret';
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ total: 1, items: [NAVER_ITEM] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns { items: [] } when no query param', async () => {
    const res = await GET(makeRequest());
    const data = await res.json();
    expect(data).toEqual({ items: [] });
  });

  it('returns 500 when Naver env vars are missing', async () => {
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;
    const res = await GET(makeRequest({ q: '노트북' }));
    expect(res.status).toBe(500);
  });

  it('returns error status when Naver API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('Bad Gateway', { status: 502 }),
    );
    const res = await GET(makeRequest({ q: '노트북' }));
    expect(res.status).toBe(502);
  });

  it('returns formatted items with proxied image URLs', async () => {
    const res = await GET(makeRequest({ q: '노트북' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(1);
    const item = data.items[0];
    expect(item.id).toBe('prod-001');
    expect(item.title).toBe('노트북'); // HTML stripped
    expect(item.lprice).toBe(1000000);
    expect(item.image).toContain('/api/image-proxy?url=');
    expect(item.brand).toBe('Samsung');
  });

  it('sanitizes query: "노트북 골라줘" searches for "노트북"', async () => {
    await GET(makeRequest({ q: '노트북 골라줘' }));
    const callArg = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(callArg).toContain(encodeURIComponent('노트북'));
    expect(callArg).not.toContain(encodeURIComponent('골라줘'));
  });

  it('passes sort and display params to Naver API', async () => {
    await GET(makeRequest({ q: '노트북', sort: 'asc', display: '5' }));
    const callArg = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(callArg).toContain('sort=asc');
    expect(callArg).toContain('display=5');
  });
});
