function toSearchKeyword(query: string): string {
  let q = query;
  q = q.replace(/[,，]\s*(지인|친구|남자\s*친구|여자\s*친구|남친|여친|부모님|엄마|아빠|남편|아내|부장님|상사|동료|선배|후배|아이|아기|본인|자신|나).*/g, '');
  q = q.replace(/\s*(추천\s*해\s*줘|추천\s*해\s*주세요|추천\s*좀|알려\s*줘|알려\s*주세요|골라\s*줘|골라\s*주세요|사야\s*해|살까요?|구매\s*해\s*줘|뭐가\s*좋|어떤\s*[게거걸것](\s*좋)?|어떤\s*거\s*좋아?)\s*$/i, '');
  q = q.replace(/\s+(지인|친구|선물용|선물\s*용)(\s|$)/g, ' ');
  q = q.replace(/[,，\s]+$/, '').replace(/\s+/g, ' ').trim();
  return q || query;
}

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
