import { toSearchKeyword } from '@/lib/search-keyword';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q');
  const sort = searchParams.get('sort') ?? 'sim';
  const display = Math.min(Number(searchParams.get('display') ?? 20), 100);

  if (!rawQuery) return Response.json({ items: [] });

  const query = toSearchKeyword(rawQuery);

  const naverId = process.env.NAVER_CLIENT_ID;
  const naverSecret = process.env.NAVER_CLIENT_SECRET;
  if (!naverId || !naverSecret) return Response.json({ error: 'No Naver API key' }, { status: 500 });

  const q = encodeURIComponent(query);
  const res = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${q}&display=${display}&sort=${sort}`,
    { headers: { 'X-Naver-Client-Id': naverId, 'X-Naver-Client-Secret': naverSecret } },
  );

  if (!res.ok) return Response.json({ error: 'Naver API error' }, { status: res.status });

  const data = await res.json() as {
    total: number;
    items: {
      title: string;
      link: string;
      image: string;
      lprice: string;
      hprice: string;
      mallName: string;
      productId: string;
      brand: string;
      maker: string;
      category1: string;
      category2: string;
    }[];
  };

  const items = (data.items ?? []).map((item) => ({
    id: item.productId,
    title: item.title.replace(/<[^>]*>/g, ''),
    link: item.link,
    image: item.image ? `/api/image-proxy?url=${encodeURIComponent(item.image)}` : '',
    lprice: parseInt(item.lprice) || 0,
    hprice: parseInt(item.hprice) || 0,
    mallName: item.mallName,
    brand: item.brand || item.maker || item.mallName,
    category1: item.category1,
    category2: item.category2,
  }));

  return Response.json({ total: data.total, items });
}
