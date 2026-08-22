// 네이버 쇼핑 이미지 CDN만 허용 — 임의 URL을 그대로 fetch하면 SSRF로 이어짐
const ALLOWED_IMAGE_HOSTS = /(^|\.)pstatic\.net$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.test(parsed.hostname)) {
    return new Response('Host not allowed', { status: 400 });
  }

  try {
    const res = await fetch(parsed, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return new Response('Failed to fetch image', { status: res.status });

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
