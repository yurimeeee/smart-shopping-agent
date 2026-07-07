/** @jest-environment node */
import { GET } from '@/app/api/image-proxy/route';

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/image-proxy');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/image-proxy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when url param is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns error status when upstream fetch fails with non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );
    const res = await GET(makeRequest({ url: 'https://example.com/img.jpg' }));
    expect(res.status).toBe(404);
  });

  it('returns 500 when fetch throws', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const res = await GET(makeRequest({ url: 'https://example.com/img.jpg' }));
    expect(res.status).toBe(500);
  });

  it('returns image data with correct Content-Type on success', async () => {
    const fakeBuffer = new ArrayBuffer(8);
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(fakeBuffer, {
        status: 200,
        headers: { 'Content-Type': 'image/webp' },
      }),
    );
    const res = await GET(makeRequest({ url: 'https://example.com/img.webp' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('sets Cache-Control header on success', async () => {
    const fakeBuffer = new ArrayBuffer(4);
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(fakeBuffer, {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
    const res = await GET(makeRequest({ url: 'https://example.com/img.jpg' }));
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('forwards request with User-Agent header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(new ArrayBuffer(4), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
    await GET(makeRequest({ url: 'https://example.com/img.jpg' }));
    const options = fetchSpy.mock.calls[0][1] as RequestInit & { headers: Record<string, string> };
    expect(options.headers['User-Agent']).toContain('Mozilla');
  });
});
